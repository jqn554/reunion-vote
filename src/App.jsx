import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [nomination, setNomination] = useState("");
  const [locations, setLocations] = useState([]);

  const [counts, setCounts] = useState({});
  const [totalVoters, setTotalVoters] = useState(0);

  // 🔥 Load locations
  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (!error) {
      setLocations(data.map((l) => l.name));
    }
  };

  // 🔥 Load vote results
  const fetchResults = async () => {
    const { data, error } = await supabase
      .from("reunion_votes")
      .select("*");

    if (error) return;

    setTotalVoters(data.length);

    const tally = {};

    data.forEach((vote) => {
      [vote.first_choice, vote.second_choice, vote.third_choice].forEach(
        (choice) => {
          if (!tally[choice]) tally[choice] = 0;
          tally[choice] += 1;
        }
      );
    });

    setCounts(tally);
  };

  // 🔁 Load on mount + refresh
  useEffect(() => {
    fetchLocations();
    fetchResults();

    const interval = setInterval(() => {
      fetchResults();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Toggle (max 3)
  const toggle = (place) => {
    if (selected.includes(place)) {
      setSelected(selected.filter((p) => p !== place));
    } else if (selected.length < 3) {
      setSelected([...selected, place]);
    }
  };

  // ✅ Add nomination to DB
  const addNomination = async () => {
    const trimmed = nomination.trim();
    if (!trimmed) return;

    const { error } = await supabase
      .from("locations")
      .insert({ name: trimmed });

    if (error) {
      if (error.code === "23505") {
        alert("Location already exists!");
      } else {
        alert("Error adding location");
      }
      return;
    }

    setNomination("");
    fetchLocations();
  };

  // ✅ Submit vote
  const handleSubmit = async () => {
    if (selected.length !== 3 || !name) {
      alert("Pick exactly 3 locations and enter your name");
      return;
    }

    const { error } = await supabase.from("reunion_votes").insert({
      voter_name: name,
      first_choice: selected[0],
      second_choice: selected[1],
      third_choice: selected[2],
    });

    if (error) {
      if (error.code === "23505") {
        alert("This name has already voted!");
      } else {
        alert("Something went wrong.");
      }
      return;
    }

    alert("Vote submitted!");

    setSelected([]);
    setName("");

    fetchResults(); // 🔥 update results immediately
  };

  // sort results
  const sortedResults = Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      background: "#f5f5f5",
      minHeight: "100vh",
      paddingTop: 40
    }}>
      <div style={{
        background: "white",
        padding: 30,
        borderRadius: 12,
        width: 400,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ textAlign: "center" }}>Cousin Reunion Vote</h1>

        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 20,
            borderRadius: 6,
            border: "1px solid #ccc"
          }}
        />

        <h3>Pick exactly 3 locations:</h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => toggle(loc)}
              style={{
                padding: "8px 12px",
                borderRadius: 20,
                border: selected.includes(loc)
                  ? "2px solid #4CAF50"
                  : "1px solid #ccc",
                background: selected.includes(loc)
                  ? "#e8f5e9"
                  : "white",
                cursor: "pointer"
              }}
            >
              {loc}
            </button>
          ))}
        </div>

        <h3 style={{ marginTop: 20 }}>Nominate a location:</h3>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Optional"
            value={nomination}
            onChange={(e) => setNomination(e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc"
            }}
          />

          <button onClick={addNomination}>
            Add
          </button>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            marginTop: 20,
            padding: 12,
            borderRadius: 8,
            background: "#4CAF50",
            color: "white",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Submit Vote
        </button>

        {/* RESULTS */}
        <h3 style={{ marginTop: 30 }}>Current Results</h3>

        <div>Total Voters: {totalVoters}</div>

        {sortedResults.map(([location, count]) => (
          <div
            key={location}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "1px solid #eee"
            }}
          >
            <span>{location}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}