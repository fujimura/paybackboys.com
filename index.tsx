import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Papa from "papaparse";
const logo = require("./logo.jpg");

interface Show {
  date: string;
  venue: string;
}

// https://docs.google.com/spreadsheets/d/1M9tmpu_hkLYeFzn1tM2nqc68GEGiVj8q2F4LJVS1VyU/edit#gid=1124112482
const SPREADSHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTs1ndgRVWLD8zf8IntYmq_Gd86CUcvC-MAq37sLMQ1oB1HAXpSlfumo42bb7GvwxwvWJQwns8pQs8V/pub?gid=0&single=true&output=csv";

class Main extends React.Component<{}, { shows: Show[] }> {
  constructor(args: {}) {
    super(args);
    this.state = { shows: [] };
  }

  async componentDidMount() {
    const csv = await (await fetch(SPREADSHEET_CSV_URL, {
      mode: "cors"
    })).text();

    const shows = Papa.parse(csv)
      .data.filter(([date]) => {
        // Show today's show
        return new Date(Date.parse(date) + 24 * 60 * 60 * 1000) > new Date();
      })
      .map(([date, venue]) => {
        return { date: date, venue: venue };
      });

    this.setState({
      shows
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
