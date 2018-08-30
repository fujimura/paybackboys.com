import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Papa from "papaparse";
const logo = require("./logo.jpg");

interface Show {
  date: string;
  venue: string;
}

const SPREADSHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBZoWsMb2wCOxYxYptDTdhQLwDcpBYzE9pywTfn6Hgk1VT03pejT-xYjxABOhxe9j0fyQ0kcgF-4Tz/pub?gid=0&single=true&output=csv";

class Main extends React.Component<{}, { shows: Show[] }> {
  constructor(args: {}) {
    super(args);
    this.state = { shows: [] };
  }

  async componentDidMount() {
    const shows = await (await fetch(SPREADSHEET_CSV_URL)).text();
    this.setState({
      shows: Papa.parse(shows).data.map(([date, venue]) => {
        return { date: date, venue: venue };
      })
    });
  }

  render() {
    const { shows } = this.state;

    return (
      <div>
        <img src={logo} />
        <h2>Upcoming shows</h2>
        <ul>
          {shows.map(({ date, venue }) => (
            <li key={date}>
              <span className="live-date">{date}</span>
              <span className="live-venue">{venue}</span>
            </li>
          ))}
        </ul>
        <iframe
          style={{ border: 0, width: "100%", height: "472px" }}
          src="https://bandcamp.com/EmbeddedPlayer/album=3511319946/size=large/bgcol=ffffff/linkcol=0687f5/artwork=small/transparent=true/"
          seamless
        >
          <a href="http://wdsounds.bandcamp.com/album/payback-boys-struggle-for-pride">
            PAYBACK BOYS &quot;struggle for pride&quot; by PAYBACK BOYS
          </a>
        </iframe>
      </div>
    );
  }
}

ReactDOM.render(<Main />, document.getElementById("root"));
