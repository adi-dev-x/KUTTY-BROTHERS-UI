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
      }
    } catch (err) {
      console.error("Save order failed", err.response?.data || err.message);
    } finally {
      if (onClose) onClose();
    }
  };

  const distinctItemNames = [...new Set(itemOptions.map((i) => i.item_name))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <button
          className="absolute right-3 top-3 rounded-md p-1 text-gray-600 hover:bg-gray-100"
          onClick={() => window.location.reload()}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Create New Order</h2>

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
              className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
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
            className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Contact Address"
            value={formData.contact_address}
            onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
            className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
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
            className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <input
            type="date"
            value={formData.returned_at}
            onChange={(e) => setFormData({ ...formData, returned_at: e.target.value })}
            className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
          >
            <option value="INITIATED">INITIATED</option>
            <option value="RESERVED">RESERVED</option>
          </select>
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Items</h3>
            <button
              className="rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-700"
              onClick={() => setShowItemForm(!showItemForm)}
            >
              {showItemForm ? "Close" : "+ Add Item"}
            </button>
          </div>
          {showItemForm && (
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Add Item</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Item Name"
                    list="item-options"
                    value={itemData.item_name}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
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
                    className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                  />
                </div>
                <input
                  type="date"
                  value={itemData.expired_at}
                  onChange={(e) => setItemData({ ...itemData, expired_at: e.target.value })}
                  className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={itemData.amount}
                  onChange={(e) => setItemData({ ...itemData, amount: e.target.value })}
                  className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-yellow-600 focus:outline-none"
                />
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setItemData({ ...itemData, tempImages: Array.from(e.target.files) })
                  }
                  className="w-full rounded-md border-2 border-dashed border-gray-300 px-3 py-2 text-sm"
                />
                {itemData.tempImages.length > 0 && (
                  uploading ? (
                    <p className="text-sm text-gray-600">Uploading...</p>
                  ) : (
                    <button
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={handleUploadImages}
                    >
                      Upload Images
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
                      className="h-16 w-16 rounded-md object-cover ring-1 ring-gray-200"
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700" onClick={handleAddItem}>
                  Save Item
                </button>
              </div>
            </div>
          )}
        </div>

        {formData.items.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {formData.items.map((it, idx) => (
              <div key={`${it.item_id}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900">{it.item_name}</h4>
                <p className="text-sm text-gray-600">Amount: {it.amount}</p>
                <p className="text-sm text-gray-600">Returned At: {it.expired_at}</p>
                {it.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.images.map((img, jdx) => (
                      <img
                        key={`${img.name}-${jdx}`}
                        src={img.url}
                        alt={img.name}
                        className="h-14 w-14 rounded-md object-cover ring-1 ring-gray-200"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700" onClick={handleSaveOrder}>
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;
