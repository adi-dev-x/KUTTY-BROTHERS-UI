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
    item_name: "",
    expired_at: "",
    amount: "",
    status: "INITIATED",
    images: [],
    tempImages: [],
  });

  useEffect(() => {
    axios
      .get("http://192.168.29.125:8080/irrl/genericApiUnjoin/customer")
      .then((res) => setCustomers(res.data.data || []))
      .catch((err) => console.error(err));

    axios
      .get("http://192.168.29.125:8080/irrl/genericApiUnjoin/itemRetrive")
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
      const res = await axios.post("http://192.168.29.125:8080/irrl/upload", form, {
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

        await axios.post("http://192.168.29.125:8080/irrl/addOrder", orderPayload, {
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
    <div className="form-overlay">
      <div className="order-form">
        <button className="close-btn" onClick={() => window.location.reload()}>
          ×
        </button>
        <h2>Create New Order</h2>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="form-grid">
          <input
            type="text"
            placeholder="Customer Name"
            value={formData.customer_name}
            list="customers-list"
            onChange={(e) => handleCustomerSelect(e.target.value)}
          />
          <datalist id="customers-list">
            {customers.map((c, idx) => (
              <option key={`${c.customer_id}-${idx}`} value={c.name} />
            ))}
          </datalist>

          <input
            type="text"
            placeholder="Contact Person"
            value={formData.contact_person}
            onChange={(e) =>
              setFormData({ ...formData, contact_person: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={formData.contact_number}
            onChange={(e) =>
              setFormData({ ...formData, contact_number: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Contact Address"
            value={formData.contact_address}
            onChange={(e) =>
              setFormData({ ...formData, contact_address: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Inventory ID"
            value={formData.inventory_id}
            readOnly
          />
          <input
            type="number"
            placeholder="Advance Amount"
            value={formData.advance_amount}
            onChange={(e) =>
              setFormData({ ...formData, advance_amount: e.target.value })
            }
          />
          <input
            type="date"
            value={formData.returned_at}
            onChange={(e) =>
              setFormData({ ...formData, returned_at: e.target.value })
            }
          />
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            <option value="INITIATED">INITIATED</option>
            <option value="RESERVED">RESERVED</option>
          </select>
        </div>

        <div className="item-section">
          <button className="btn" onClick={() => setShowItemForm(!showItemForm)}>
            + Add Item
          </button>
          {showItemForm && (
            <div className="item-form">
              <h3>Add Item</h3>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Item Name"
                  list="item-options"
                  value={itemData.item_name}
                  onChange={(e) => handleItemSelect(e.target.value)}
                />
                <datalist id="item-options">
                  {distinctItemNames.map((name, idx) => (
                    <option key={`${name}-${idx}`} value={name} />
                  ))}
                </datalist>

                <input
                  type="date"
                  value={itemData.expired_at}
                  onChange={(e) =>
                    setItemData({ ...itemData, expired_at: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={itemData.amount}
                  onChange={(e) =>
                    setItemData({ ...itemData, amount: e.target.value })
                  }
                />
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setItemData({
                      ...itemData,
                      tempImages: Array.from(e.target.files),
                    })
                  }
                />
                {itemData.tempImages.length > 0 &&
                  (uploading ? (
                    <p className="loading-text">Uploading...</p>
                  ) : (
                    <button className="btn" onClick={handleUploadImages}>
                      Upload Images
                    </button>
                  ))}
              </div>

              {itemData.images.length > 0 && (
                <div className="images-preview">
                  {itemData.images.map((img, idx) => (
                    <img
                      key={`${img.name}-${idx}`}
                      src={img.url}
                      alt={img.name}
                    />
                  ))}
                </div>
              )}

              <button className="btn save-btn" onClick={handleAddItem}>
                Save Item
              </button>
            </div>
          )}
        </div>

        {formData.items.length > 0 && (
          <div className="added-items">
            {formData.items.map((it, idx) => (
              <div key={`${it.item_id}-${idx}`} className="item-card">
                <h4>{it.item_name}</h4>
                <p>Amount: {it.amount}</p>
                <p>Returned At: {it.expired_at}</p>
                {it.images.length > 0 && (
                  <div className="thumbs">
                    {it.images.map((img, jdx) => (
                      <img
                        key={`${img.name}-${jdx}`}
                        src={img.url}
                        alt={img.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="btn save-btn" onClick={handleSaveOrder}>
          Save Order
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
