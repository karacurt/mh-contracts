export function param(name: string) {
  process.argv.forEach((val, index) => {
    //console.log(`${index}: ${val}`);
    if (val === name) {
      return;
    }
  });
}
