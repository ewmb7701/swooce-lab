import { Window } from "happy-dom";
import { Page, PageFactory, type CommonAPI } from "#swooce";

const TARGET_ROUTE_PATH = "/index.html";

export default class extends PageFactory {
  override create(_api: CommonAPI) {
    const pageWindow = new Window();
    const pageDocument = pageWindow.document;

    const pageHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Index
    </title>
  </head>
  <body>
    <h1>Index</h1>
  </body>
</html>
`;
    pageDocument.write(pageHtml);

    const page = new Page(
      new URL(import.meta.url),
      pageDocument,
      TARGET_ROUTE_PATH,
    );

    return Promise.resolve(page);
  }
}
