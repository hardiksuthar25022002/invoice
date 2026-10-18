import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

import { ApiError } from '@/api'

// A4 at 96dpi. Feeding this to html2canvas as the window size makes the capture
// use the desktop layout even when the user is on a phone, so the PDF is always
// built from the same design.
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

/** A4 is 595 × 842pt — the same ratio as the pixel box above. */
const A4_RATIO = A4_HEIGHT_PX / A4_WIDTH_PX

/**
 * How much taller than A4 the sheet may be and still be placed on a single
 * page: 5% of squeeze is invisible, while a genuine overrun (dozens of line
 * items) keeps its size and continues onto extra pages instead.
 */
const SINGLE_PAGE_TOLERANCE = 1.05

/**
 * Runs against the document html2canvas clones for the capture.
 *
 * The sheet lives inside the app shell, and the clone is laid out at
 * windowWidth (A4, 794px) — narrower than a normal desktop window. Left alone,
 * the sidebar's spacer and the page padding squeeze the sheet into a tall,
 * narrow column, which then no longer fits an A4 page. Dropping the chrome and
 * pinning the sheet to A4 measurements makes the capture match the designed
 * layout, and lets the sheet's gradient background cover the whole page.
 */
function prepareClone(doc: Document) {
  const chrome = [
    '[data-slot="sidebar"]',
    '[data-slot="sidebar-container"]',
    '[data-slot="sidebar-gap"]',
    'header',
    '.no-print',
  ]

  for (const selector of chrome) {
    doc.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.style.display = 'none'
    })
  }

  const inset = doc.querySelector<HTMLElement>('[data-slot="sidebar-inset"]')
  if (inset) inset.style.margin = '0'

  const paper = doc.querySelector<HTMLElement>('.invoice-paper')
  if (!paper) return

  // The sheet's own colours come from src/styles/invoice.css, which is
  // hex-only: html2canvas cannot parse the oklch() values the Tailwind theme
  // would otherwise contribute (see the note in src/index.css).
  paper.style.width = `${A4_WIDTH_PX}px`
  paper.style.minHeight = `${A4_HEIGHT_PX}px`
  paper.style.maxWidth = 'none'
  paper.style.margin = '0'
  paper.style.boxShadow = 'none'
  paper.style.border = 'none'
  paper.style.borderRadius = '0'

  // The centred content wrapper: remove the padding that would narrow the sheet.
  const wrapper = paper.parentElement
  if (wrapper) {
    wrapper.style.padding = '0'
    wrapper.style.margin = '0'
    wrapper.style.maxWidth = 'none'
  }
}

/**
 * Colour of the sheet at the very bottom of the capture. The background is a
 * gradient, so a flat fill can never match it exactly — but the uncovered area,
 * when there is any, sits along the bottom edge, which is what this samples.
 */
function bottomEdgeColour(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) return [255, 255, 255] as const

  const x = Math.floor(canvas.width / 2)
  const [r, g, b] = context.getImageData(x, canvas.height - 1, 1, 1).data

  return [r, g, b] as const
}

/**
 * Turn the on-screen invoice preview into a downloaded PDF, with no browser
 * print dialog. The DOM already carries the full invoice design, so we snapshot
 * it rather than re-implementing the layout.
 */
export async function downloadInvoicePdf(
  element: HTMLElement | null,
  filename: string,
) {
  if (!element) throw new ApiError(500, 'Nothing to export yet.')

  let canvas: HTMLCanvasElement

  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      onclone: prepareClone,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ApiError(500, `Could not render the invoice: ${message}`)
  }

  const image = canvas.toDataURL('image/jpeg', 0.95)

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Paint the page with the sheet's own background first, so no white can show
  // through at the edges (rounding, antialiasing, a shorter-than-A4 capture).
  const [fillR, fillG, fillB] = bottomEdgeColour(canvas)
  pdf.setFillColor(fillR, fillG, fillB)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  const imageRatio = canvas.height / canvas.width

  if (imageRatio <= A4_RATIO * SINGLE_PAGE_TOLERANCE) {
    // One page, edge to edge: the sheet is A4-shaped (prepareClone pins it), so
    // this fills the page exactly and the gradient runs off all four sides.
    pdf.addImage(image, 'JPEG', 0, 0, pageWidth, pageHeight)
    pdf.save(`${sanitize(filename)}.pdf`)
    return
  }

  // Very long invoice: keep the text legible at full width and spill onto extra
  // pages instead of shrinking it onto one.
  const imageWidth = pageWidth
  const imageHeight = (canvas.height * imageWidth) / canvas.width

  let heightLeft = imageHeight
  let position = 0

  pdf.addImage(image, 'JPEG', 0, position, imageWidth, imageHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(image, 'JPEG', 0, position, imageWidth, imageHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`${sanitize(filename)}.pdf`)
}

function sanitize(name: string) {
  return String(name || 'invoice').replace(/[^\w.-]+/g, '_')
}
