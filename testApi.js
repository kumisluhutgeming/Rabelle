async function test() {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=-6.9147&longitude=107.6098&localityLanguage=id`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}
test();
