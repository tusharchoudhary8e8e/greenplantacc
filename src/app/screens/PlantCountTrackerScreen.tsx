import { useState, useMemo, useEffect, useRef } from "react";
import { Voucher } from "../../db/database";
import { MONO, fmt } from "../utils/accounting";
import { PanelHeader } from "../components/HeaderBars";

export function PlantCountTrackerScreen({
  dayBook,
  onEsc,
  onAlterVoucher,
}: {
  dayBook: Voucher[];
  onEsc: () => void;
  onAlterVoucher?: (vch: Voucher) => void;
}) {
  const [selIdx, setSelIdx] = useState(0);
  const [detailSelIdx, setDetailSelIdx] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  
  // Drill-down state
  const [selectedPlantType, setSelectedPlantType] = useState<string | null>(null);

  // Filter out all "Production" vouchers
  const productionVouchers = useMemo(() => {
    return dayBook.filter((v) => v.type === "Production");
  }, [dayBook]);

  // Calculate Running Totals of Plant Counts per Plant Type
  const plantSummary = useMemo(() => {
    const countsMap: Record<string, number> = {};
    productionVouchers.forEach((v) => {
      const plantType = (v.particulars || "Unknown Plant").trim();
      const count = Number(v.qty) || 0;
      countsMap[plantType] = (countsMap[plantType] || 0) + count;
    });

    return Object.entries(countsMap)
      .map(([plantType, qty]) => ({ plantType, qty }))
      .filter((p) => p.plantType.toLowerCase().includes(searchFilter.toLowerCase()))
      .sort((a, b) => a.plantType.localeCompare(b.plantType));
  }, [productionVouchers, searchFilter]);

  // Vouchers for the selected plant type (drill-down list)
  const detailVouchers = useMemo(() => {
    if (!selectedPlantType) return [];
    return productionVouchers.filter(
      (v) => (v.particulars || "").trim().toLowerCase() === selectedPlantType.trim().toLowerCase()
    );
  }, [productionVouchers, selectedPlantType]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedPlantType === null) {
        // Main summary view navigation
        if (e.key === "Escape") {
          e.preventDefault();
          onEsc();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelIdx((idx) => Math.min(idx + 1, Math.max(0, plantSummary.length - 1)));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelIdx((idx) => Math.max(idx - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (plantSummary[selIdx]) {
            setSelectedPlantType(plantSummary[selIdx].plantType);
            setDetailSelIdx(0);
          }
        }
      } else {
        // Drill-down detail view navigation
        if (e.key === "Escape") {
          e.preventDefault();
          setSelectedPlantType(null);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setDetailSelIdx((idx) => Math.min(idx + 1, Math.max(0, detailVouchers.length - 1)));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setDetailSelIdx((idx) => Math.max(idx - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (detailVouchers[detailSelIdx] && onAlterVoucher) {
            onAlterVoucher(detailVouchers[detailSelIdx]);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [plantSummary, detailVouchers, selectedPlantType, selIdx, detailSelIdx, onEsc, onAlterVoucher]);

  // UI rendering helper for line item extraction
  const getVoucherItemDetails = (v: Voucher) => {
    // Seed is usually index 0, Cocopeat is index 1, Tray is index 2
    const seed = v.items?.[0];
    const cocopeat = v.items?.[1];
    const tray = v.items?.[2];
    return {
      seedName: seed?.name || "Seed Item",
      seedQty: seed?.qty ? `${seed.qty}g` : "-",
      cocopeatQty: cocopeat?.qty ? `${cocopeat.qty}g` : "-",
      trayQty: tray?.qty ? `${tray.qty} units` : "-",
    };
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#6b7c8c", fontFamily: MONO, overflow: "hidden" }}>
      <PanelHeader title={selectedPlantType ? `Production Bills — ${selectedPlantType}` : "Plant Count Tracker — Nursery Inventory"} />
      
      <div style={{ padding: "4px 8px", background: "#d9e6f2", borderBottom: "1px solid #b0b0b0", fontSize: 11, color: "#222222", display: "flex", justifyContent: "space-between" }}>
        {selectedPlantType ? (
          <span>↑↓ Navigate · Enter Alter Bill · Esc Back to Summary</span>
        ) : (
          <span>↑↓ Navigate · Enter View Production Bills · Esc Back</span>
        )}
        <span style={{ fontWeight: 700, color: "#0066cc" }}>
          {selectedPlantType ? `Showing ${detailVouchers.length} bills for ${selectedPlantType}` : "Plant count is incremented by Production vouchers"}
        </span>
      </div>

      {selectedPlantType === null ? (
        /* Summary View Mode */
        <>
          {/* Filter Bar */}
          <div style={{ padding: "6px 12px", background: "#f4f8fb", borderBottom: "1px solid #b0b0b0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#333333" }}>Search Plant Type:</span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setSelIdx(0);
              }}
              placeholder="Type plant name to filter summary..."
              style={{ flex: 1, padding: "3px 8px", border: "1px solid #0066cc", fontFamily: MONO, fontSize: 12, outline: "none", background: "#ffffff" }}
            />
          </div>

          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            
            {/* Left Side: Summary Table */}
            <div style={{ flex: 1, background: "#ffffff", borderRight: "2px solid #b0b0b0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ background: "#e2edf5", padding: "6px 12px", fontSize: 12, fontWeight: 700, borderBottom: "1px solid #b0b0b0" }}>
                🌱 Running Plant Totals in Nursery (Press Enter to open bills)
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#9bc5e2", borderBottom: "1px solid #7eaac9" }}>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", borderRight: "1px solid #b0b0b0" }}>Stock of Plant (Output Plant Type)</th>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "right" }}>Total Qty in Current Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantSummary.map((item, i) => {
                      const isSelected = i === selIdx;
                      return (
                        <tr
                          key={item.plantType}
                          style={{
                            background: isSelected ? "#fff8c5" : i % 2 === 0 ? "#ffffff" : "#f4f8fb",
                            color: "#000000",
                            fontWeight: isSelected ? 700 : 400,
                            borderBottom: "1px solid #e0e0e0",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelIdx(i);
                            setSelectedPlantType(item.plantType);
                            setDetailSelIdx(0);
                          }}
                        >
                          <td style={{ padding: "6px 8px", borderRight: "1px solid #b0b0b0" }}>
                            <span style={{ color: isSelected ? "#0066cc" : "transparent", marginRight: 4 }}>▶</span>
                            {item.plantType}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "#0f766e", fontWeight: 700 }}>
                            {item.qty.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {plantSummary.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ padding: "20px", textAlign: "center", color: "#777777" }}>
                          -- No Plants Tracked in Nursery --
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: History / Log Table */}
            <div style={{ flex: 1.5, background: "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ background: "#e2edf5", padding: "6px 12px", fontSize: 12, fontWeight: 700, borderBottom: "1px solid #b0b0b0" }}>
                📋 All Seed Sowing Events (Audit Trail)
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#9bc5e2", borderBottom: "1px solid #7eaac9" }}>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", width: "15%", borderRight: "1px solid #b0b0b0" }}>Date</th>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", width: "18%", borderRight: "1px solid #b0b0b0" }}>Vch No.</th>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", width: "35%", borderRight: "1px solid #b0b0b0" }}>Plant Type</th>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "right", width: "15%", borderRight: "1px solid #b0b0b0" }}>Qty Sown</th>
                      <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", width: "17%" }}>Narration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionVouchers.map((v, i) => (
                      <tr
                        key={v.id || i}
                        style={{
                          background: i % 2 === 0 ? "#ffffff" : "#f4f8fb",
                          color: "#000000",
                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        <td style={{ padding: "5px 8px", borderRight: "1px solid #b0b0b0" }}>{v.date}</td>
                        <td style={{ padding: "5px 8px", borderRight: "1px solid #b0b0b0", fontWeight: 700, color: "#0066cc" }}>{v.vno}</td>
                        <td style={{ padding: "5px 8px", borderRight: "1px solid #b0b0b0" }}>{v.particulars}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0", color: "#0f766e", fontWeight: 700 }}>
                          +{Number(v.qty || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "5px 8px", fontSize: 11, color: "#666" }}>{v.narration || ""}</td>
                      </tr>
                    ))}
                    {productionVouchers.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#777777" }}>
                          -- No Sowing Events Recorded --
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      ) : (
        /* Detailed Drill-Down View Mode */
        <div style={{ flex: 1, background: "#ffffff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: "#e2edf5", padding: "8px 12px", fontSize: 13, fontWeight: 700, borderBottom: "1px solid #b0b0b0", display: "flex", justifyContent: "space-between" }}>
            <span>📂 Production Bills Register for Plant: <strong style={{ color: "#0066cc" }}>{selectedPlantType}</strong></span>
            <button
              onClick={() => setSelectedPlantType(null)}
              style={{ background: "#0066cc", color: "#fff", border: "none", padding: "2px 8px", fontSize: 11, cursor: "pointer", fontFamily: MONO }}
            >
              Back to Summary (Esc)
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#9bc5e2", borderBottom: "1px solid #7eaac9" }}>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", borderRight: "1px solid #b0b0b0", width: "10%" }}>Date</th>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", borderRight: "1px solid #b0b0b0", width: "12%" }}>Voucher No.</th>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0", width: "12%" }}>Seeds Sown</th>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "left", borderRight: "1px solid #b0b0b0", width: "20%" }}>Seed Item</th>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0", width: "12%" }}>Seed Used</th>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0", width: "12%" }}>Cocopeat Used</th>
                  <th style={{ color: "#000000", padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0", width: "12%" }}>Trays Used</th>
                </tr>
              </thead>
              <tbody>
                {detailVouchers.map((v, i) => {
                  const isSelected = i === detailSelIdx;
                  const details = getVoucherItemDetails(v);
                  return (
                    <tr
                      key={v.id || i}
                      style={{
                        background: isSelected ? "#fff8c5" : i % 2 === 0 ? "#ffffff" : "#f4f8fb",
                        color: "#000000",
                        fontWeight: isSelected ? 700 : 400,
                        borderBottom: "1px solid #e0e0e0",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setDetailSelIdx(i);
                        if (onAlterVoucher) onAlterVoucher(v);
                      }}
                    >
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #b0b0b0" }}>{v.date}</td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #b0b0b0", color: "#0066cc", fontWeight: 700 }}>{v.vno}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0", color: "#0f766e", fontWeight: 700 }}>
                        {Number(v.qty || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "6px 8px", borderRight: "1px solid #b0b0b0" }}>{details.seedName}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0" }}>{details.seedQty}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0" }}>{details.cocopeatQty}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", borderRight: "1px solid #b0b0b0" }}>{details.trayQty}</td>
                    </tr>
                  );
                })}
                {detailVouchers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#777777" }}>
                      -- No production vouchers found for this plant type --
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
