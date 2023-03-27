/**
 * Usage:
 * const bench = benchmarkStart("My benchmark");
 * / / Do task
 * bench();
 * / / (console logs "My benchmark")
 * */
export function benchmarkStart(title: string) {
    console.time(title);
    return () => console.timeEnd(title);
}

