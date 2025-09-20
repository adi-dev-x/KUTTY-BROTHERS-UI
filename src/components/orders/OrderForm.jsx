import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Orders.css";

const OrderForm = ({ onAddOrder }) => {
  const [customers, setCustomers] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    contact_person: "",
    contact_number: "",
    contact_address: "",
    inventory_id: "550e8400-e29b-41d4-a716-446655440000",
    advance_amount: 0,
    returned_at: "",
    status: "INITIATED",
    items: [],
  });

  const [showItemForm, setShowItemForm] = useState(false);
  const [itemData, setItemData] = useState({
    item_id: "",
    item_name: "",
    expired_at: "",
    amount: 0,
    status: "INITIATED",
    images: [],
    tempImages: [],
  });

  // Fetch customers and items
  useEffect(() => {
    axios.get("https://ems.binlaundry.com/irrl/genericApiUnjoin/customer")
      .then(res => setCustomers(res.data.data || []))
      .catch(err => console.error(err));

    axios.get("https://ems.binlaundry.com/irrl/genericApiUnjoin/itemRetrive")
      .then(res => setItemOptions(res.data.data || []))
      .catch(err => console.error(err));
  }, []);

  // Customer select
  const handleCustomerSelect = (name) => {
    const customer = customers.find(c => c.name === name);
    setFormData({
      ...formData,
      customer_name: name,
      customer_id: customer ? customer.customer_id : "",
    });
  };

  // Item select from autocomplete
  const handleItemSelect = (name) => {
    const item = itemOptions.find(i => i.item_name === name);
    setItemData({
      ...itemData,
      item_name: name,
      item_id: item ? item.item_id : "",
    });
  };

  // Upload images
  const handleUploadImages = async () => {
    if (!itemData.tempImages || itemData.tempImages.length === 0) return alert("Select images first");

    const form = new FormData();
    itemData.tempImages.forEach(file => form.append("images", file));

    try {
      const res = await axios.post("https://ems.binlaundry.com/irrl/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = res.data.filenames.map(filename => ({
        name: filename,
        url: `https://ems.binlaundry.com/resources/${filename}`,
      }));

      setItemData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedFiles],
        tempImages: [],
      }));

      alert("Images uploaded successfully!");
    } catch (err) {
      console.error("Upload failed", err.response?.data || err.message);
      alert("Upload failed! Check console for details.");
    }
  };

  // Add item to order
  const handleAddItem = () => {
    if (!itemData.item_id) return alert("Please select a valid item");

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          ...itemData,
          status: "INITIATED",
        },
      ],
    });

    setItemData({
      item_id: "",
      item_name: "",
      expired_at: "",
      amount: 0,
      status: "INITIATED",
      images: [],
      tempImages: [],
    });
    setShowItemForm(false);
  };

  // Save order
  const handleSaveOrder = async () => {
    if (!formData.customer_id) return alert("Please select a valid customer");
    if (!formData.items || formData.items.length === 0) return alert("Add at least one item");

    // Use item_newid instead of item_code
    const itemsPayload = formData.items.map(it => ({
      item_newid: it.item_id,
      rent_amount: it.amount,
      before_images: it.images.map(img => img.name),
      returned_str: it.expired_at,
      status: "INITIATED",
    }));

    const orderPayload = {
      customer_id: formData.customer_id,
      inventory_id: formData.inventory_id,
      advance_amount: formData.advance_amount,
      status: "INITIATED",
      contact_name: formData.contact_person,
      contact_number: formData.contact_number,
      shipping_address: formData.contact_address,
      items: itemsPayload,
    };

    try {
      const res = await axios.post("https://ems.binlaundry.com/irrl/addOrder", orderPayload, {
        headers: { "Content-Type": "application/json" },
      });
      alert("Order saved successfully!");
      onAddOrder(res.data);

      setFormData({
        customer_id: "",
        customer_name: "",
        contact_person: "",
        contact_number: "",
        contact_address: "",
        inventory_id: "550e8400-e29b-41d4-a716-446655440000",
        advance_amount: 0,
        returned_at: "",
        status: "INITIATED",
        items: [],
      });
    } catch (err) {
      console.error("Save order failed", err.response?.data || err.message);
      alert("Failed to save order! Check console for details.");
    }
  };

  return (
    <div className="order-form">
      <h2>Create New Order</h2>

      <div className="form-grid">
        <input
          type="text"
          placeholder="Customer Name"
          value={formData.customer_name}
          list="customers-list"
          onChange={e => handleCustomerSelect(e.target.value)}
        />
        <datalist id="customers-list">
          {customers.map(c => <option key={c.customer_id} value={c.name} />)}
        </datalist>

        <input type="text" placeholder="Contact Person" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
        <input type="text" placeholder="Contact Number" value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} />
        <input type="text" placeholder="Contact Address" value={formData.contact_address} onChange={e => setFormData({ ...formData, contact_address: e.target.value })} />
        <input type="text" placeholder="Inventory ID" value={formData.inventory_id} readOnly />
        <input type="number" placeholder="Advance Amount" value={formData.advance_amount} onChange={e => setFormData({ ...formData, advance_amount: parseInt(e.target.value) || 0 })} />
        <input type="date" value={formData.returned_at} onChange={e => setFormData({ ...formData, returned_at: e.target.value })} />
      </div>

      {/* Item Section */}
      <div className="item-section">
        <button className="btn" onClick={() => setShowItemForm(!showItemForm)}>+ Add Item</button>
        {showItemForm && (
          <div className="item-form">
            <h3>Add Item</h3>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Item Name"
                list="item-options"
                value={itemData.item_name}
                onChange={e => handleItemSelect(e.target.value)}
              />
              <datalist id="item-options">{itemOptions.map(i => <option key={i.item_id} value={i.item_name} />)}</datalist>

              <input type="date" value={itemData.expired_at} onChange={e => setItemData({ ...itemData, expired_at: e.target.value })} />
              <input type="number" placeholder="Amount" value={itemData.amount} onChange={e => setItemData({ ...itemData, amount: parseInt(e.target.value) || 0 })} />

              <input type="file" multiple onChange={e => setItemData({ ...itemData, tempImages: Array.from(e.target.files) })} />
              {itemData.tempImages.length > 0 && <button className="btn" onClick={handleUploadImages}>Upload Images</button>}
            </div>

            {itemData.images.length > 0 && (
              <div className="images-preview">
                <h5>Before Images</h5>
                {itemData.images.map((img) => <img key={img.name} src={img.url} alt={img.name} />)}
              </div>
            )}

            <button className="btn save-btn" onClick={handleAddItem}>Save Item</button>
          </div>
        )}
      </div>

      {/* Display Added Items */}
      {formData.items.length > 0 && (
        <div className="added-items">
          {formData.items.map((it) => (
            <div key={it.item_id} className="item-card">
              <h4>{it.item_name}</h4>
              <p>Amount: {it.amount}</p>
              <p>Returned At: {it.expired_at}</p>
              {it.images.length > 0 && (
                <div className="thumbs">
                  {it.images.map((img) => <img key={img.name} src={img.url} alt={img.name} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="btn save-btn" onClick={handleSaveOrder}>Save Order</button>
    </div>
  );
};

export default OrderForm;
