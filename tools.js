export const MyPromiseAll = async (FAlist, parallel = 99999) => {
  const ret = [];
  for (let i = 0; i < FAlist.length; i += parallel) {
    const tmp = FAlist.slice(i, i + parallel);
    const pp = tmp.map(([func, args]) => {
      return func(...args);
    });
    // console.log(`Handling ${pp.length} promises`);
    const res = await Promise.all(pp);
    for (let j = 0; j < res.length; ++j) {
      ret.push(res[j]);
    }
  }
  return ret;
};
