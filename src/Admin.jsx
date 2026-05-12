import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Admin() {
  const [authorized, setAuthorized] = useState(null);
  const [votes, setVotes] = useState([]);
  const [counts, setCounts] = useState({});
  const [totalVoters, setTotalVoters] = useState(0);

  // 🔐 password check runs once
  useEffect(() => {
    const password = prompt("Enter admin password:");
    if (password === "cuffy4Bet") {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }
  }, []);

  const fetchVotes = async () => {
    const { data, error } = await supabase
      .from("reunion_votes")
      .select("*");

    if (error) return;

    setVotes(data);
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

  useEffect(() => {
    if (!authorized) return;

    fetchVotes();

    const interval = setInterval(fetchVotes, 3000);
    return () => clearInterval(interval);
  }, [authorized]);

  // ⏳ waiting for password input
  if (authorized === null) return <div>Loading...</div>;

  // ❌ wrong password
  if (authorized === false) return <h1>Access denied</h1>;

  // ✅ authorized view
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <h2>Total Voters: {totalVoters}</h2>

      <h3>Results:</h3>

      {sorted.map(([location, count]) => (
        <div key={location}>
          {location} — {count}
        </div>
      ))}

      <h3 style={{ marginTop: 30 }}>Raw Votes:</h3>

      {votes.map((v) => (
        <div key={v.id}>
          {v.voter_name}: {v.first_choice}, {v.second_choice},{" "}
          {v.third_choice}
        </div>
      ))}
    </div>
  );
}