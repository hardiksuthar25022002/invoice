import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

const emptyItem = () => ({
  description: "",
  quantity: 1,
  unit_price: 0,
});

export default function NewInvoice() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_id: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    tax_rate: 0,
    discount: 0,
    notes: "",
    status: "draft",
  });

  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    api
      .listCompanies()
      .then((cs) => {
        setCompanies(cs);

        if (cs.length) {
          setForm((f) => ({
            ...f,
            company_id: cs[0].id,
          }));
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const updateItem = (idx, field, value) => {
    setItems((items) =>
      items.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const subtotal = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  );

  const taxAmount = (subtotal * (Number(form.tax_rate) || 0)) / 100;

  const grandTotal = subtotal + taxAmount - (Number(form.discount) || 0);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.company_id) {
      setError("Select a company first.");
      return;
    }

    const validItems = items
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
      }));

    if (validItems.length === 0) {
      setError("Add at least one line item.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        company_id: Number(form.company_id),
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        status: form.status,
        tax_rate: Number(form.tax_rate) || 0,
        discount: Number(form.discount) || 0,
        notes: form.notes || null,
        items: validItems,
      };

      const inv = await api.createInvoice(payload);

      navigate(`/invoices/${inv.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (companies.length === 0) {
    return (
      <>
        <div className="page-header">
          <div>
            <div className="eyebrow">Generate</div>
            <h1 className="page-title">New invoice</h1>
          </div>
        </div>

        <div className="empty-state card">
          <h3>Add a company first</h3>

          <p>You need at least one company before creating an invoice.</p>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate("/companies")}
          >
            Go to companies
          </button>
        </div>
      </>
    );
  }

  const selectedCompany = companies.find(
    (company) => Number(company.id) === Number(form.company_id),
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Generate</div>

          <h1 className="page-title">New invoice</h1>

          <p className="page-sub">
            Fill in the details below — the invoice number is assigned
            automatically.
          </p>
        </div>
      </div>

      {error && (
        <p
          style={{
            color: "var(--brick)",
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        {/* BILLED TO (CLIENT) */}
        <div className="card" style={{ marginBottom: 20 }}>
          <span
            className="eyebrow"
            style={{
              display: "block",
              marginBottom: 14,
            }}
          >
            Billed to
          </span>

          <div className="form-grid">
            <div className="field">
              <label>Company</label>

              <select
                value={form.company_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company_id: e.target.value,
                  })
                }
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {selectedCompany?.address && (
              <div className="field field-full">
                <label>Address</label>

                <textarea rows="2" value={selectedCompany.address} readOnly />
              </div>
            )}

            <div className="field">
              <label>Issue date</label>

              <input
                type="date"
                required
                value={form.issue_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    issue_date: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label>Due date</label>

              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    due_date: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <div className="card" style={{ marginBottom: 20 }}>
          <span
            className="eyebrow"
            style={{
              display: "block",
              marginBottom: 14,
            }}
          >
            Line items
          </span>

          <div className="item-row item-row-head">
            <span className="bill-label">Description</span>

            <span className="bill-label">Quantity</span>

            <span className="bill-label">Unit price</span>

            <span />
          </div>

          {items.map((item, idx) => (
            <div className="item-row" key={idx}>
              <div className="item-field">
                <span className="item-label">Description</span>

                <input
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                />
              </div>

              <div className="item-field">
                <span className="item-label">Quantity</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </div>

              <div className="item-field">
                <span className="item-label">Unit price</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                />
              </div>

              <button
                type="button"
                className="remove-btn"
                aria-label={`Remove line item ${idx + 1}`}
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setItems([...items, emptyItem()])}
          >
            + Add line item
          </button>

          <div className="totals-box">
            <div className="totals-row">
              <span>Subtotal</span>

              <span className="mono">${subtotal.toFixed(2)}</span>
            </div>

            <div className="totals-row">
              <span>Tax</span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.tax_rate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tax_rate: e.target.value,
                    })
                  }
                  style={{
                    width: 55,
                    padding: "4px 6px",
                    borderRadius: 5,
                    border: "1px solid var(--line)",
                  }}
                />
                %
              </span>
            </div>

            <div className="totals-row">
              <span>Discount</span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                $
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount: e.target.value,
                    })
                  }
                  style={{
                    width: 70,
                    padding: "4px 6px",
                    borderRadius: 5,
                    border: "1px solid var(--line)",
                  }}
                />
              </span>
            </div>

            <div className="totals-row grand">
              <span>Total</span>

              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="card" style={{ marginBottom: 24 }}>
          <span
            className="eyebrow"
            style={{
              display: "block",
              marginBottom: 14,
            }}
          >
            Notes
          </span>

          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 7,
              border: "1px solid var(--line)",
            }}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Generating…" : "Generate invoice"}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/invoices")}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
