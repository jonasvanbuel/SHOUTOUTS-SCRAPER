let myArray = ['a', 1, 'a', 2, '1'];

myArray = myArray.filter((value, index, array) => {
  return array.indexOf(value) === index;
});

console.log(myArray);
