import { Window } from "happy-dom";
import { Page, PageFactory } from "#swooce";

export default class extends PageFactory {
  override createPages(): Array<Page> {
    const pageWindow = new Window();
    const pageDocument = pageWindow.document;

    const pageHtml = `
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>
`;

    pageDocument.write(pageHtml);

    const page = new Page("./index.html", pageDocument);
    const pages = [page];

    return pages;
  }
}
