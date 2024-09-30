import ref from "./ref";
const a = 1;

function c() {
  const a = 2;
  console.log(a + 1);
}
console.log(a + 1);
() => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("ok");
    }, 3000);
  });
};
console.log(ref);
