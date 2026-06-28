function pct(part, total) {
  if (!total) return "–";
  return `${Math.round((part / total) * 1000) / 10}%`;
}

function roleLabel(role) {
  const labels = {
    primary: "Primary",
    extra: "Extra",
    in_progress: "In progress",
    intermediate: "Intermediate",
    supplement: "Supplement",
    satellite: "Satellite",
    other: "Other",
  };
  return labels[role] || role || "Other";
}

async function loadDataCoverageJson() {
  const resp = await fetch("data_coverage.json", { cache: "no-store" });
  if (!resp.ok) throw new Error(`data_coverage.json HTTP ${resp.status}`);
  return resp.json();
}

function renderCoverageTable(counties) {
  const tbody = document.getElementById("coverage-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const sorted = [...(counties || [])].sort((a, b) =>
    String(a.county_name || "").localeCompare(String(b.county_name || ""), undefined, {
      sensitivity: "base",
    }),
  );

  for (const county of sorted) {
    const tr = document.createElement("tr");
    const countyLabel = escapeHtml(
      `${county.county_name || ""}${county.state ? `, ${county.state}` : ""}`,
    );
    const primary = escapeHtml(county.primary_file || "—");
    const files = Array.isArray(county.files) ? county.files : [];

    const fileRows = files
      .map((f) => {
        const err = f.error ? `<div class="coverage-file-error">${escapeHtml(f.error)}</div>` : "";
        return `<tr>
          <td><span class="coverage-role coverage-role--${escapeHtml(f.role || "other")}">${escapeHtml(roleLabel(f.role))}</span></td>
          <td><code class="coverage-path">${escapeHtml(f.file || "")}</code></td>
          <td>${Number(f.raw_rows || 0).toLocaleString()}</td>
          <td>${Number(f.unique_rows_added || 0).toLocaleString()}</td>
          <td>${Number(f.rows_with_address || 0).toLocaleString()}</td>
          <td>${Number(f.rows_geocoded || 0).toLocaleString()}</td>
        </tr>${err ? `<tr><td colspan="6">${err}</td></tr>` : ""}`;
      })
      .join("");

    tr.innerHTML = `
      <td>
        <details class="coverage-details">
          <summary>${countyLabel}</summary>
          <div class="coverage-files-wrap">
            <table class="coverage-files-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>File</th>
                  <th>Raw rows</th>
                  <th>Unique added</th>
                  <th>With address</th>
                  <th>Geocoded</th>
                </tr>
              </thead>
              <tbody>${fileRows || '<tr><td colspan="6">No files</td></tr>'}</tbody>
            </table>
          </div>
        </details>
      </td>
      <td>${Number(county.rows_total || 0).toLocaleString()}</td>
      <td>${Number(county.rows_with_address || 0).toLocaleString()} <span class="coverage-pct">(${pct(county.rows_with_address, county.rows_total)})</span></td>
      <td>${Number(county.rows_geocoded || 0).toLocaleString()} <span class="coverage-pct">(${pct(county.rows_geocoded, county.rows_total)})</span></td>
      <td><code class="coverage-path">${primary}</code></td>`;
    tbody.appendChild(tr);
  }
}

async function initDataCoveragePage() {
  const generatedEl = document.getElementById("generated-at");
  try {
    const data = await loadDataCoverageJson();
    const totals = data.totals || {};
    document.getElementById("total-counties").textContent =
      totals.num_counties?.toLocaleString?.() ?? "–";
    document.getElementById("total-rows").textContent =
      totals.rows_total?.toLocaleString?.() ?? "–";
    document.getElementById("total-rows-address").textContent =
      totals.rows_with_address?.toLocaleString?.() ?? "–";
    document.getElementById("total-rows-geocoded").textContent =
      totals.rows_geocoded?.toLocaleString?.() ?? "–";
    renderCoverageTable(data.counties);
    if (data.generated_at && generatedEl) {
      generatedEl.textContent = `Coverage updated ${new Date(data.generated_at).toLocaleString()}`;
    }
  } catch (err) {
    console.error(err);
    if (generatedEl) generatedEl.textContent = "Could not load data coverage";
  }
}

document.addEventListener("DOMContentLoaded", initDataCoveragePage);
