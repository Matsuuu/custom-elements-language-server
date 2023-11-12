const globby = require("globby");

const fileTypesToMatch = ["js", "ts", "jsx", "tsx", "cjs", "mjs", "cjsx", "mjsx"];

async function test() {
    const pattern = `./**/*.(${fileTypesToMatch.join("|")})`
    console.log(pattern)
    const res = await globby([pattern, "!node_modules"], {
        gitignore: true,
        cwd: "."
    })

    console.log(res);

}

// test();

async function cemTest() {
    const pattern = `**/custom-elements-manifest.config.*`;
    console.log(pattern)
    const res = await globby(["!node_modules", pattern], {
        gitignore: true,
        cwd: "."
    })

    console.log(res);

}

cemTest();
