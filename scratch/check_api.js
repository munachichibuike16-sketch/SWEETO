async function checkApi() {
    try {
        const res = await fetch('http://localhost:3000/api/products');
        const data = await res.json();
        console.log('Products count:', data.length);
        console.log('Sample product:', JSON.stringify(data[0], null, 2));
    } catch (err) {
        console.error('API check failed:', err.message);
    }
}

checkApi();
