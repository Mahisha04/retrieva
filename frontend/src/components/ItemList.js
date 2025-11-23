import React, { useEffect, useState } from "react";

function ItemList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/items")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded items:", data);
        setItems(data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Found Items</h2>

      {items.length === 0 && <p>No items found yet.</p>}

      <div className="items-grid">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <img
              src={item.image_url}
              alt={item.name}
              width="200"
              style={{ borderRadius: "8px" }}
            />
            <p>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ItemList;
