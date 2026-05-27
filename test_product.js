async function testProduct() {
  const payload = {
    name: 'Test Product',
    price: 100,
    category: 'Test',
    brand: 'Apple',
    image_url: '/uploads/test.jpg',
    stockQuantity: 10,
    lowStockThreshold: 5
  };

  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(response.status, response.statusText);
    const text = await response.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}

testProduct();
