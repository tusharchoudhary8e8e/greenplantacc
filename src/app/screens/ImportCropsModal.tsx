import React, { useState } from "react";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Product, SupabaseService } from "../../db/supabaseService";

interface ImportCropsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

export const ImportCropsModal: React.FC<ImportCropsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg("");
    }
  };

  const handleDownloadSample = () => {
    // Generate sample Excel workbook
    const sampleData = [
      {
        "Crop Name": "CHILLY",
        Category: "Vegetables",
        Unit: "plants",
        "Variant 1": "TALWAR",
        "Price 1": 1.6,
        "Variant 2": "VNR 212",
        "Price 2": 1.8,
      },
      {
        "Crop Name": "TOMATO",
        Category: "Vegetables",
        Unit: "plants",
        "Variant 1": "ABHILASH",
        "Price 1": 2.0,
        "Variant 2": "HEM SONA",
        "Price 2": 2.2,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CropsTemplate");
    XLSX.writeFile(wb, "MetricAccounting_Sample_Crops.xlsx");
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrorMsg("Please choose an Excel file (.xlsx or .xls) first.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const wsName = wb.SheetNames[0];
      const sheet = wb.Sheets[wsName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rawRows.length === 0) {
        setErrorMsg("The uploaded Excel file contains no data rows.");
        setLoading(false);
        return;
      }

      const parsedProducts: Product[] = rawRows.map((row) => {
        const variants = [];
        if (row["Variant 1"] || row["Variant"]) {
          variants.push({
            name: String(row["Variant 1"] || row["Variant"]),
            price: parseFloat(row["Price 1"] || row["Price"] || 1.5),
          });
        }
        if (row["Variant 2"]) {
          variants.push({
            name: String(row["Variant 2"]),
            price: parseFloat(row["Price 2"] || 1.5),
          });
        }

        return {
          name: String(row["Crop Name"] || row["Name"] || "CROP").toUpperCase(),
          category: String(row["Category"] || "Vegetables"),
          unit: String(row["Unit"] || "plants"),
          variants: variants.length > 0 ? variants : [{ name: "STANDARD", price: 1.5 }],
          is_active: true,
        };
      });

      const count = await SupabaseService.bulkImportProducts(parsedProducts);
      setLoading(false);
      onImportComplete(count);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Failed to parse Excel file: ${err.message || err}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Import Crops</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Upload Excel File
            </label>
            <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500 transition">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              Upload .xlsx or .xls file
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Sample Download Link */}
          <div className="text-xs font-medium text-slate-600">
            Download sample excel file.{" "}
            <button
              type="button"
              onClick={handleDownloadSample}
              className="text-[#00a651] font-bold hover:underline inline-flex items-center gap-1"
            >
              "Download Excel"
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-[#00a651] text-[#00a651] rounded-xl text-xs font-bold hover:bg-emerald-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleImport}
            className="px-6 py-2 bg-[#00a651] text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
};
