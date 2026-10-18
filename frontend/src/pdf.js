import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { ApiError } from './api.js'

// A4 at 96dpi. Feeding this to html2canvas as the window size makes the capture
// use the desktop layout even when the user is on a phone, so the PDF is always
// built from the same design.
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

/**
 * Turn the on-screen invoice preview into a downloaded PDF, with no browser
 * print dialog. The DOM already carries the full invoice design, so we snapshot
 * it rather than re-implementing the layout.
 */
export async function downloadInvoicePdf(element, filename) {
  if (!element) throw new ApiError(500, 'Nothing to export yet.')

  let canvas

  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      onclone: (doc) => {
        const paper = doc.querySelector('.invoice-paper')
        if (paper) {
          paper.style.boxShadow = 'none'
          paper.style.border = 'none'
          paper.style.borderRadius = '0'
        }
      },
    })
  } catch (err) {
    throw new ApiError(500, `Could not render the invoice: ${err.message}`)
  }

  const image = canvas.toDataURL('image/jpeg', 0.95)

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imageWidth = pageWidth
  const imageHeight = (canvas.height * imageWidth) / canvas.width

  // Tall invoices spill onto more pages instead of being cut off.
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

function sanitize(name) {
  return String(name || 'invoice').replace(/[^\w.-]+/g, '_')
}
