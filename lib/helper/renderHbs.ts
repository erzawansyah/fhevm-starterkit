import fs from "fs"
import path from "path";
import Handlebars from "handlebars";

export function renderHbsFile<T extends object>(
    templatePath: string,
    data: T
): string {
    const absPath = path.resolve(templatePath);
    const source = fs.readFileSync(absPath, "utf8");

    const template = Handlebars.compile(source, {
        noEscape: true,
        strict: true
    });

    return template(data);
}
