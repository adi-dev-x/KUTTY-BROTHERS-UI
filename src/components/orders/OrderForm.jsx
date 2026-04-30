import React, { useState, useEffect } from "react";
import axios from "axios";

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
    const item = itemOptions.find((i) => i.item_name === name);
    setItemData({
      ...itemData,
      item_name: name,
      item_id: item ? item.item_id : "",
      item_code: item ? item.item_code : "",
    });
  };

  const handleUploadImages = async () => {
    if (!itemData.tempImages || itemData.tempImages.length === 0) {
      showMessage("error", "Select images first");
      return;
    }

    const form = new FormData();
    itemData.tempImages.forEach((file) => form.append("images", file));

    try {
      setUploading(true); // start loading
      const res = await axios.post("https://ems.binlaundry.com/irrl/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = (res.data.urls || []).map((url, index) => ({
        url,
        name: `image_${Date.now()}_${index}`, // fallback name
      }));

      setItemData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedFiles],
        tempImages: [],
      }));

      showMessage("success", "Images uploaded successfully!");
    } catch (err) {
      console.error("Upload failed", err.response?.data || err.message);
      showMessage("error", "Upload failed! Check console.");
    } finally {
      setUploading(false); // stop loading
    }
  };

  const handleAddItem = () => {
    if (!itemData.item_id) {
      showMessage("error", "Please select a valid item");
      return;
    }

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...itemData,
          status: "INITIATED",
          amount: parseInt(itemData.amount) || 0,
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

  const distinctItemNames = [...new Set(itemOptions.map((i) => i.item_name))];

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create order</h2>
            <p className="mt-0.5 text-sm text-slate-600">Customer, contact, and line items.</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="p-6">

        {message.text && (
          <div
            className={
              "mb-3 rounded-md px-3 py-2 text-sm " +
              (message.type === "success"
                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20")
            }
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Customer Name"
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

          <input
            type="text"
            placeholder="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            className={field}
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            className={field}
          />
          <input
            type="text"
            placeholder="Contact Address"
            value={formData.contact_address}
            onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
            className={field}
          />
          <input
            type="text"
            placeholder="Inventory ID"
            value={formData.inventory_id}
            readOnly
            className="hidden w-full cursor-not-allowed rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder="Advance Amount"
            value={formData.advance_amount}
            onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
            className={field}
          />
          <input
            type="date"
            value={formData.returned_at}
            onChange={(e) => setFormData({ ...formData, returned_at: e.target.value })}
            className={field}
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className={field}
          >
            <option value="INITIATED">INITIATED</option>
            <option value="RESERVED">RESERVED</option>
          </select>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Items</h3>
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-amber-600 hover:to-amber-700"
              onClick={() => setShowItemForm(!showItemForm)}
            >
              {showItemForm ? "Close" : "+ Add item"}
            </button>
          </div>
          {showItemForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Add item</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Item Name"
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
                  <input
                    type="text"
                    placeholder="Item Code"
                    value={itemData.item_code}
                    onChange={(e) => {
                      const code = e.target.value;
                      const item = itemOptions.find((i) => i.item_code === code);
                      setItemData({
                        ...itemData,
                        item_code: code,
                        item_id: item ? item.item_id : "",
                      });
                    }}
                    className={field}
                  />
                </div>
                <input
                  type="date"
                  value={itemData.expired_at}
                  onChange={(e) => setItemData({ ...itemData, expired_at: e.target.value })}
                  className={field}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={itemData.amount}
                  onChange={(e) => setItemData({ ...itemData, amount: e.target.value })}
                  className={field}
                />
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setItemData({ ...itemData, tempImages: Array.from(e.target.files) })
                  }
                  className="w-full rounded-xl border-2 border-dashed border-slate-200 px-3 py-2 text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-amber-900"
                />
                {itemData.tempImages.length > 0 && (
                  uploading ? (
                    <p className="text-sm text-slate-600">Uploading…</p>
                  ) : (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      onClick={handleUploadImages}
                    >
                      Upload images
                    </button>
                  )
                )}
              </div>

              {itemData.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {itemData.images.map((img, idx) => (
                    <img
                      key={`${img.name}-${idx}`}
                      src={img.url}
                      alt={img.name}
                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700" onClick={handleAddItem}>
                  Save item
                </button>
              </div>
            </div>
          )}
        </div>

        {formData.items.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {formData.items.map((it, idx) => (
              <div key={`${it.item_id}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">{it.item_name}</h4>
                <p className="text-sm text-slate-600">Item code: {it.item_code}</p>
                <p className="text-sm text-slate-600">Amount: {it.amount}</p>
                <p className="text-sm text-slate-600">Returned at: {it.expired_at}</p>
                {it.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.images.map((img, jdx) => (
                      <img
                        key={`${img.name}-${jdx}`}
                        src={img.url}
                        alt={img.name}
                        className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700"
            onClick={handleSaveOrder}
          >
            Save order
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
