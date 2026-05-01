import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { uploadIrrlOrderImages } from "../../utils/irrlUploadImages";

/** Match item row from itemRetrive — API keys vary (item_code, sub_code, item_id, etc.) */
function findItemInOptions(options, partial) {
  if (!Array.isArray(options) || !partial) return null;
  const id = partial.item_id;
  const name = (partial.item_name || "").trim();
  const code = (partial.item_code || "").trim();

  if (id !== "" && id != null) {
    const byId = options.find(
      (i) =>
        String(
          i.item_id ?? i.item_newid ?? i.inventory_id ?? i.delivery_item_id ?? ""
        ) === String(id)
    );
    if (byId) return byId;
  }
  if (code) {
    const byCode = options.find((i) => {
      const candidates = [i.item_code, i.sub_code, i.new_sub_code, i.inventory_id].map((x) =>
        x == null ? "" : String(x).trim()
      );
      return candidates.some((c) => c && c === code);
    });
    if (byCode) return byCode;
  }
  if (name) {
    const exact = options.find((i) => (i.item_name || i.name || "").trim() === name);
    if (exact) return exact;
    const lower = name.toLowerCase();
    const ci = options.find(
      (i) => (i.item_name || i.name || "").trim().toLowerCase() === lower
    );
    if (ci) return ci;
  }
  return null;
}

const OrderForm = ({ onAddOrder, onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    contact_person: "",
    contact_number: "",
    contact_address: "",
    inventory_id: "550e8400-e29b-41d4-a716-446655440000",
    advance_amount: "",
    discount: "",
    returned_at: "",
    status: "INITIATED",
    items: [],
  });

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemData, setItemData] = useState({
    item_id: "",
    item_code: "",
    item_name: "",
    expired_at: "",
    amount: "",
    status: "INITIATED",
    images: [],
    tempImages: [],
  });

  const itemsSubtotal = useMemo(
    () =>
      formData.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [formData.items]
  );

  const discountAmount = Math.max(0, parseInt(formData.discount, 10) || 0);
  const totalAfterDiscount = Math.max(0, itemsSubtotal - discountAmount);

  useEffect(() => {
    axios
      .get("https://ems.binlaundry.com/irrl/genericApiUnjoin/customer")
      .then((res) => setCustomers(res.data.data || []))
      .catch((err) => console.error(err));

    axios
      .get("https://ems.binlaundry.com/irrl/genericApiUnjoin/itemRetrive")
      .then((res) => setItemOptions(res.data.data || []))
      .catch((err) => console.error(err));
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleCustomerSelect = (name) => {
    const customer = customers.find((c) => c.name === name);
    setFormData({
      ...formData,
      customer_name: name,
      customer_id: customer ? customer.customer_id : "",
    });
  };

  const handleItemSelect = (name) => {
    const item = findItemInOptions(itemOptions, { item_name: name });
    const resolvedId = item?.item_id ?? item?.item_newid ?? item?.inventory_id ?? "";
    const resolvedCode =
      item?.item_code ?? item?.sub_code ?? item?.new_sub_code ?? itemData.item_code ?? "";
    setItemData({
      ...itemData,
      item_name: item ? String(item.item_name ?? item.name ?? name) : name,
      item_id: resolvedId !== "" ? String(resolvedId) : "",
      item_code: resolvedCode ? String(resolvedCode) : "",
    });
  };

  const handleUploadImages = async (pickedFiles) => {
    try {
      setUploading(true);
      const uploadedFiles = await uploadIrrlOrderImages(
        pickedFiles !== undefined && pickedFiles !== null ? pickedFiles : itemData.tempImages
      );
      setItemData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedFiles],
        tempImages: [],
      }));
      showMessage("success", "Images uploaded successfully!");
    } catch (err) {
      if (err.message === "Select images first") {
        showMessage("error", "Select images first");
      } else {
        console.error("Upload failed", err.response?.data || err.message);
        showMessage("error", "Upload failed! Check console.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAddItem = () => {
    const matched = findItemInOptions(itemOptions, itemData);
    const resolvedId =
      matched?.item_id ??
      matched?.item_newid ??
      matched?.inventory_id ??
      itemData.item_id;
    if (resolvedId == null || String(resolvedId).trim() === "") {
      showMessage("error", "Please select an item from the list or enter a code that matches inventory.");
      return;
    }

    const resolvedName = (matched?.item_name || matched?.name || itemData.item_name || "").trim() || "Item";
    const resolvedCode =
      String(matched?.item_code ?? matched?.sub_code ?? matched?.new_sub_code ?? itemData.item_code ?? "").trim();

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...itemData,
          item_id: String(resolvedId),
          item_name: resolvedName,
          item_code: resolvedCode,
          status: "INITIATED",
          amount: parseInt(itemData.amount, 10) || 0,
        },
      ],
    });

    setItemData({
      item_id: "",
      item_code: "",
      item_name: "",
      expired_at: "",
      amount: "",
      status: "INITIATED",
      images: [],
      tempImages: [],
    });
    setShowItemForm(false);
    showMessage("success", "Item added to order!");
  };

  const handleSaveOrder = async () => {
    try {
      if (formData.customer_id && formData.items.length > 0) {
        const itemsPayload = formData.items.map((it) => ({
          item_newid: it.item_id,
          rent_amount: parseInt(it.amount) || 0,
          before_images: (it.images || []).map((img) => img.url), // ✅ pass URL, not name
          returned_str: it.expired_at,
          status: "INITIATED",
        }));

        const orderPayload = {
          customer_id: formData.customer_id,
          inventory_id: formData.inventory_id,
          advance_amount: parseInt(formData.advance_amount) || 0,
          discount_amount: discountAmount,
          status: formData.status,
          contact_name: formData.contact_person,
          contact_number: formData.contact_number,
          shipping_address: formData.contact_address,
          items: itemsPayload,
        };

        await axios.post("https://ems.binlaundry.com/irrl/addOrder", orderPayload, {
          headers: { "Content-Type": "application/json" },
        });

        if (onAddOrder) onAddOrder(orderPayload);
        window.location.reload();
      }
    } catch (err) {
      console.error("Save order failed", err.response?.data || err.message);
    } finally {
      if (onClose) onClose();
    }
  };

  const distinctItemNames = [
    ...new Set(
      itemOptions
        .map((i) => (i.item_name || i.name || "").trim())
        .filter(Boolean)
    ),
  ];

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25";

  const labelCls =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

  const sectionTitle = (title, titleClass = "mb-4") => (
    <h3
      className={`flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.08em] text-slate-500 ${titleClass}`}
    >
      <span className="h-1 w-7 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-400/40" />
      {title}
    </h3>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[6px]">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_25px_80px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-amber-100/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/30 px-6 py-5 shadow-sm">
          <div className="min-w-0 pr-2">
            <h2 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Create order
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Customer, contact, and line items — all in one place.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl border border-slate-200/80 bg-white/80 p-2.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-md"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            <span className="block text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50/50 to-white px-6 pb-7 pt-6">

        {message.text && (
          <div
            role="status"
            className={
              "mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-sm " +
              (message.type === "success"
                ? "border border-emerald-200/80 bg-emerald-50/95 text-emerald-800"
                : "border border-red-200/80 bg-red-50/95 text-red-800")
            }
          >
            <span
              className={
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base font-bold " +
                (message.type === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700")
              }
              aria-hidden
            >
              {message.type === "success" ? "✓" : "!"}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100">
          {sectionTitle("Customer & contact")}
          <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-4">
            <div className="min-w-0">
              <label htmlFor="order-customer" className={labelCls}>
                Customer name
              </label>
              <input
                id="order-customer"
                type="text"
                placeholder="Search or pick from list"
                value={formData.customer_name}
                list="customers-list"
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className={field}
              />
              <datalist id="customers-list">
                {customers.map((c, idx) => (
                  <option key={`${c.customer_id}-${idx}`} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="min-w-0">
              <label htmlFor="order-contact-person" className={labelCls}>
                Contact person
              </label>
              <input
                id="order-contact-person"
                type="text"
                placeholder="Name"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className={field}
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="order-contact-number" className={labelCls}>
                Contact number
              </label>
              <input
                id="order-contact-number"
                type="text"
                placeholder="Phone"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className={field}
              />
            </div>
            <div className="col-span-3 min-w-0">
              <label htmlFor="order-contact-address" className={labelCls}>
                Shipping address
              </label>
              <input
                id="order-contact-address"
                type="text"
                placeholder="Full address"
                value={formData.contact_address}
                onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                className={field}
              />
            </div>
            <input
              type="text"
              placeholder="Inventory ID"
              value={formData.inventory_id}
              readOnly
              className="hidden w-full cursor-not-allowed rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100">
          {sectionTitle("Order details")}
          <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-4">
            <div>
              <label htmlFor="order-advance" className={labelCls}>
                Advance (₹)
              </label>
              <input
                id="order-advance"
                type="number"
                placeholder="0"
                value={formData.advance_amount}
                onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="order-return-date" className={labelCls}>
                Return date
              </label>
              <input
                id="order-return-date"
                type="date"
                value={formData.returned_at}
                onChange={(e) => setFormData({ ...formData, returned_at: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="order-status" className={labelCls}>
                Status
              </label>
              <select
                id="order-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={field}
              >
                <option value="INITIATED">INITIATED</option>
                <option value="RESERVED">Quotation</option>
              </select>
            </div>
          </div>
        </section>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            {sectionTitle("Line items", "mb-0")}
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/25 transition hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]"
              onClick={() => setShowItemForm(!showItemForm)}
            >
              {showItemForm ? "Close form" : "+ Add item"}
            </button>
          </div>
          {showItemForm && (
            <div className="rounded-2xl border border-amber-100/80 bg-white p-5 shadow-inner ring-1 ring-amber-500/10">
              <h4 className="mb-4 text-sm font-semibold text-slate-900">New line item</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Item name</label>
                  <input
                    type="text"
                    placeholder="Search or pick from list"
                    list="item-options"
                    value={itemData.item_name}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className={field}
                  />
                  <datalist id="item-options">
                    {distinctItemNames.map((name, idx) => (
                      <option key={`${name}-${idx}`} value={name} />
                    ))}
                  </datalist>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Item code</label>
                  <input
                    type="text"
                    placeholder="Inventory code"
                    value={itemData.item_code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const item = findItemInOptions(itemOptions, { item_code: code });
                      const resolvedId =
                        item?.item_id ?? item?.item_newid ?? item?.inventory_id ?? "";
                      setItemData({
                        ...itemData,
                        item_code: code,
                        item_id: resolvedId !== "" ? String(resolvedId) : "",
                        item_name:
                          item?.item_name != null || item?.name != null
                            ? String(item.item_name ?? item.name)
                            : itemData.item_name,
                      });
                    }}
                    className={field}
                  />
                </div>
                <div>
                  <label className={labelCls}>Return / expiry</label>
                  <input
                    type="date"
                    value={itemData.expired_at}
                    onChange={(e) => setItemData({ ...itemData, expired_at: e.target.value })}
                    className={field}
                  />
                </div>
                <div>
                  <label className={labelCls}>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={itemData.amount}
                    onChange={(e) => setItemData({ ...itemData, amount: e.target.value })}
                    className={field}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Before photos</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setItemData({ ...itemData, tempImages: Array.from(e.target.files) })
                    }
                    className="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-sm text-slate-600 transition hover:border-amber-300 hover:bg-amber-50/30 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-amber-500 file:to-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:shadow-sm"
                  />
                </div>
                {itemData.tempImages.length > 0 && (
                  uploading ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-700 sm:col-span-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      Uploading…
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/80 hover:text-slate-900 sm:col-span-2 sm:w-fit"
                      onClick={handleUploadImages}
                    >
                      Upload images
                    </button>
                  )
                )}
              </div>

              {itemData.images.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Uploaded
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {itemData.images.map((img, idx) => (
                      <img
                        key={`${img.name}-${idx}`}
                        src={img.url}
                        alt={img.name}
                        className="h-16 w-16 rounded-xl object-cover shadow-sm ring-2 ring-white"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg active:scale-[0.98]"
                  onClick={handleAddItem}
                >
                  Add to order
                </button>
              </div>
            </div>
          )}
        </div>

        {formData.items.length > 0 && (
          <div className="mt-4 space-y-3">
            {formData.items.map((it, idx) => (
              <div
                key={`${it.item_id}-${idx}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:border-amber-100 hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-bold text-slate-600">
                      #{idx + 1}
                    </span>
                    <h4 className="truncate text-sm font-bold text-slate-900">{it.item_name}</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Code <span className="font-mono font-medium text-slate-700">{it.item_code || "—"}</span>
                  </p>
                  {it.expired_at ? (
                    <p className="text-xs text-slate-500">
                      Return / expiry <span className="font-medium text-slate-700">{it.expired_at}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-3 py-1.5 text-sm font-bold tabular-nums text-amber-900 ring-1 ring-amber-500/20">
                    ₹{Number(it.amount || 0).toLocaleString("en-IN")}
                  </span>
                  {it.images.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {it.images.map((img, jdx) => (
                        <img
                          key={`${img.name}-${jdx}`}
                          src={img.url}
                          alt={img.name}
                          className="h-12 w-12 rounded-lg object-cover ring-2 ring-white shadow-sm"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex min-w-0 flex-nowrap items-end gap-3 overflow-x-auto border-t border-slate-200/80 bg-gradient-to-r from-transparent via-slate-50/80 to-transparent pb-1 pt-8 [-webkit-overflow-scrolling:touch] sm:gap-5">
          {formData.items.length > 0 ? (
            <>
              <div className="flex shrink-0 flex-col gap-1">
                <label htmlFor="order-discount" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                  Discount ₹
                </label>
                <input
                  id="order-discount"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: e.target.value })
                  }
                  className={`${field} w-[5.5rem] shrink-0 px-2 py-2 sm:w-28 sm:px-3.5`}
                />
              </div>
              <div className="flex shrink-0 items-baseline gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/80 px-3 py-2 tabular-nums ring-1 ring-amber-100 sm:px-4 sm:py-2.5">
                <span className="text-xs font-bold text-slate-800 sm:text-sm">Total</span>
                <span className="text-base font-bold tracking-tight text-amber-800 sm:text-xl">
                  ₹{totalAfterDiscount.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1 shrink" aria-hidden />
          )}
          <div className="ml-auto flex shrink-0 pb-0.5">
            <button
              type="button"
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/35 active:scale-[0.98] sm:px-8 sm:py-3"
              onClick={handleSaveOrder}
            >
              Save order
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
