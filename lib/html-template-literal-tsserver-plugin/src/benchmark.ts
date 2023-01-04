export function benchmarkStart(title: string) {
    const timeNow = Date.now();
    return () => console.log(title + ": ", Date.now() - timeNow);
}
