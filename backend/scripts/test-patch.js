(async ()=>{
  try{
    const res = await fetch('http://localhost:5000/items/12',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ description:'updated-from-test' })
    });
    console.log('status',res.status);
    const body = await res.json();
    console.log('body',body);
  }catch(e){console.error(e)}
})();
