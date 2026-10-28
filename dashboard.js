// Small helpers shared by the dashboard pages.
const $ = (id) => document.getElementById(id);

function barHTML(pct) {
  return '<span class="bar"><i style="width:' + pct + '%"></i></span>';
}

// "3 hours ago", "yesterday", "never"
function ago(ts) {
  if (!ts) return "never";
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return mins + " minutes ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? " hour ago" : " hours ago");
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : days + " days ago";
}
