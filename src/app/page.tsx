"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Upload, Download, Palette, LayoutTemplate, X, Image as ImageIcon, Crosshair, ChevronDown } from "lucide-react";
import piexif from "piexifjs";

const MapComponent = dynamic(() => import("@/components/Map"), { 
  ssr: false, 
  loading: () => <div className="h-48 w-full bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div> 
});

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Location State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locationData, setLocationData] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Design State
  const [bgColor, setBgColor] = useState("#0f172a");
  const [bgOpacity, setBgOpacity] = useState(70);
  const [textColor, setTextColor] = useState("#ffffff");
  const [template, setTemplate] = useState("A");

  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await response.json();
      
      setSearchResults(data || []);
      setIsDropdownOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setIsDropdownOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const addressParts = result.display_name.split(", ");
    const name = addressParts[0];
    const address = result.display_name;
    
    setLocationData({ name, address, lat, lng });
    setSearchQuery(name);
    setIsDropdownOpen(false);
  };

  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data && data.display_name) {
        const addressParts = data.display_name.split(", ");
        const name = addressParts[0] || "Pinned Location";
        const address = data.display_name;
        setLocationData({ name, address, lat, lng });
        setSearchQuery(name);
      } else {
        setLocationData({ name: "Unknown Location", address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setLocationData({ name: "Selected Location", address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
    } finally {
      setIsSearching(false);
    }
  };

  const drawCanvas = useCallback(async () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    await new Promise((resolve) => { img.onload = resolve; });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    if (locationData) {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
      };

      ctx.fillStyle = `rgba(${hexToRgb(bgColor)}, ${bgOpacity / 100})`;
      ctx.fillStyle = textColor; // Text color used below

      const scale = Math.max(canvas.width / 1920, 1); // scale text based on image size relative to 1080p
      const padding = 40 * scale;

      const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
        if (!text) return [];
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + " " + word).width;
          if (width < maxWidth) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        return lines;
      };

      ctx.fillStyle = `rgba(${hexToRgb(bgColor)}, ${bgOpacity / 100})`;

      if (template === "A") {
        // Minimalist Bottom-Left
        const boxW = canvas.width * 0.65; // 65% of image width
        const titleSize = 36 * scale;
        const addrSize = 22 * scale;
        const coordSize = 18 * scale;
        const lineSpacing = 30 * scale;
        const contentPadding = 30 * scale;
        
        ctx.font = `bold ${titleSize}px sans-serif`;
        const titleTokens = wrapText(ctx, locationData.name, boxW - (contentPadding * 2));
        
        ctx.font = `${addrSize}px sans-serif`;
        const addrTokens = wrapText(ctx, locationData.address, boxW - (contentPadding * 2));

        const boxH = contentPadding * 2 + (titleTokens.length * titleSize) + (addrTokens.length * lineSpacing) + coordSize + 25 * scale;
        const x = padding; // outer margin from canvas edge
        const y = canvas.height - boxH - padding;
        
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 20 * scale);
        ctx.fill();

        ctx.fillStyle = textColor;
        
        let currentY = y + contentPadding + titleSize - 8 * scale; // adjust for baseline
        
        ctx.font = `bold ${titleSize}px sans-serif`;
        titleTokens.forEach((line) => {
           ctx.fillText(line, x + contentPadding, currentY);
           currentY += titleSize + 4 * scale;
        });
        
        currentY += 8 * scale; // gap after title
        
        ctx.font = `${addrSize}px sans-serif`;
        addrTokens.forEach((line) => {
           ctx.fillText(line, x + contentPadding, currentY);
           currentY += lineSpacing;
        });

        currentY += 15 * scale; // gap before coords
        
        ctx.font = `italic ${coordSize}px sans-serif`;
        ctx.fillText(`${locationData.lat.toFixed(5)}, ${locationData.lng.toFixed(5)}`, x + contentPadding, currentY);

      } else if (template === "B") {
        // Full Width Strip Bottom
        const leftColWidth = canvas.width * 0.4 - (padding * 2); // left col for Name + Coords
        const rightColWidth = canvas.width * 0.6 - (padding * 2); // right col for Address
        
        const titleSize = 34 * scale;
        const addrSize = 22 * scale;

        ctx.font = `bold ${titleSize}px sans-serif`;
        const titleTokens = wrapText(ctx, locationData.name, leftColWidth);

        ctx.font = `${addrSize}px sans-serif`;
        const addrTokens = wrapText(ctx, locationData.address, rightColWidth);
        
        const leftSideH = (40 + titleTokens.length * 40 + 35) * scale;
        const rightSideH = (50 + addrTokens.length * 28) * scale;
        const boxH = Math.max(leftSideH, rightSideH, 100 * scale);
        const y = canvas.height - boxH;
        
        ctx.fillRect(0, y, canvas.width, boxH);

        ctx.fillStyle = textColor;
        
        // Left side: Name and Coordinates
        let currentYLeft = y + 40 * scale;
        ctx.font = `bold ${titleSize}px sans-serif`;
        titleTokens.forEach((line) => {
           ctx.fillText(line, padding, currentYLeft);
           currentYLeft += 40 * scale;
        });
        
        ctx.font = `${addrSize}px sans-serif`;
        ctx.fillText(`${locationData.lat.toFixed(5)}, ${locationData.lng.toFixed(5)}`, padding, currentYLeft);
        
        // Right side: Address
        ctx.textAlign = "right";
        ctx.font = `${addrSize}px sans-serif`;
        addrTokens.forEach((line, i) => {
           ctx.fillText(line, canvas.width - padding, y + 40 * scale + (i * 28 * scale));
        });
        ctx.textAlign = "left"; // reset alignment

      } else if (template === "C") {
        // Minimalist Top-Left
        const boxW = canvas.width * 0.65; // 65% of image width
        const titleSize = 36 * scale;
        const addrSize = 22 * scale;
        const coordSize = 18 * scale;
        const lineSpacing = 30 * scale;
        const contentPadding = 30 * scale;
        
        ctx.font = `bold ${titleSize}px sans-serif`;
        const titleTokens = wrapText(ctx, locationData.name, boxW - (contentPadding * 2));
        
        ctx.font = `${addrSize}px sans-serif`;
        const addrTokens = wrapText(ctx, locationData.address, boxW - (contentPadding * 2));

        const boxH = contentPadding * 2 + (titleTokens.length * titleSize) + (addrTokens.length * lineSpacing) + coordSize + 25 * scale;
        const x = padding; // outer margin from canvas edge
        const y = padding; // Top padding
        
        ctx.beginPath();
        ctx.roundRect(x, y, boxW, boxH, 20 * scale);
        ctx.fill();

        ctx.fillStyle = textColor;
        
        let currentY = y + contentPadding + titleSize - 8 * scale; // adjust for baseline
        
        ctx.font = `bold ${titleSize}px sans-serif`;
        titleTokens.forEach((line) => {
           ctx.fillText(line, x + contentPadding, currentY);
           currentY += titleSize + 4 * scale;
        });
        
        currentY += 8 * scale; // gap after title
        
        ctx.font = `${addrSize}px sans-serif`;
        addrTokens.forEach((line) => {
           ctx.fillText(line, x + contentPadding, currentY);
           currentY += lineSpacing;
        });

        currentY += 15 * scale; // gap before coords
        
        ctx.font = `italic ${coordSize}px sans-serif`;
        ctx.fillText(`${locationData.lat.toFixed(5)}, ${locationData.lng.toFixed(5)}`, x + contentPadding, currentY);

      } else if (template === "D") {
        // Full Width Strip Top
        const leftColWidth = canvas.width * 0.4 - (padding * 2); // left col for Name + Coords
        const rightColWidth = canvas.width * 0.6 - (padding * 2); // right col for Address
        
        const titleSize = 34 * scale;
        const addrSize = 22 * scale;

        ctx.font = `bold ${titleSize}px sans-serif`;
        const titleTokens = wrapText(ctx, locationData.name, leftColWidth);

        ctx.font = `${addrSize}px sans-serif`;
        const addrTokens = wrapText(ctx, locationData.address, rightColWidth);
        
        const leftSideH = (40 + titleTokens.length * 40 + 35) * scale;
        const rightSideH = (50 + addrTokens.length * 28) * scale;
        const boxH = Math.max(leftSideH, rightSideH, 100 * scale);
        const y = 0; // Top edge
        
        ctx.fillRect(0, y, canvas.width, boxH);

        ctx.fillStyle = textColor;
        
        // Left side: Name and Coordinates
        let currentYLeft = y + 40 * scale;
        ctx.font = `bold ${titleSize}px sans-serif`;
        titleTokens.forEach((line) => {
           ctx.fillText(line, padding, currentYLeft);
           currentYLeft += 40 * scale;
        });
        
        ctx.font = `${addrSize}px sans-serif`;
        ctx.fillText(`${locationData.lat.toFixed(5)}, ${locationData.lng.toFixed(5)}`, padding, currentYLeft);
        
        // Right side: Address
        ctx.textAlign = "right";
        ctx.font = `${addrSize}px sans-serif`;
        addrTokens.forEach((line, i) => {
           ctx.fillText(line, canvas.width - padding, y + 40 * scale + (i * 28 * scale));
        });
        ctx.textAlign = "left"; // reset alignment
      }
    }
  }, [image, locationData, bgColor, bgOpacity, textColor, template]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const degToDmsRational = (degFloat: number) => {
    const minFloat = Math.abs(degFloat) % 1 * 60;
    const secFloat = minFloat % 1 * 60;
    const deg = Math.floor(Math.abs(degFloat));
    const min = Math.floor(minFloat);
    const sec = Math.round(secFloat * 100);
    return [[deg, 1], [min, 1], [sec, 100]];
  };

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    setIsGenerating(true);

    try {
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.95);
      
      let finalJpeg = dataUrl;
      
      if (locationData) {
        const exifObj = { "0th": {}, "Exif": {}, "GPS": {} };
        const latRef = locationData.lat < 0 ? "S" : "N";
        const lngRef = locationData.lng < 0 ? "W" : "E";

        (exifObj as any)["GPS"][piexif.GPSIFD.GPSLatitudeRef] = latRef;
        (exifObj as any)["GPS"][piexif.GPSIFD.GPSLatitude] = degToDmsRational(locationData.lat);
        (exifObj as any)["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lngRef;
        (exifObj as any)["GPS"][piexif.GPSIFD.GPSLongitude] = degToDmsRational(locationData.lng);
        (exifObj as any)["GPS"][piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];

        const exifBytes = piexif.dump(exifObj);
        finalJpeg = piexif.insert(exifBytes, dataUrl);
      }

      const link = document.createElement("a");
      link.href = finalJpeg;
      link.download = `geotagged-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Error generating image", e);
      alert("Error generating image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-100/50 to-transparent z-0 pointer-events-none"></div>

      {/* Floating Header */}
      <header className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-white/70 backdrop-blur-xl px-5 py-3 rounded-2xl shadow-sm border border-slate-200/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">GeoTag Pro</h1>
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Studio Editor</p>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 w-full h-full flex items-center justify-center relative z-10 p-6 pt-24 pr-[460px]">
        {!image ? (
          <label className="relative group cursor-pointer flex flex-col items-center justify-center w-full max-w-3xl h-[500px] rounded-[2rem] border-2 border-dashed border-indigo-200/80 bg-white/40 hover:bg-white/80 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 backdrop-blur-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="z-10 flex flex-col items-center text-center p-8">
              <div className="mb-8 p-5 rounded-3xl bg-indigo-50 group-hover:bg-indigo-100 shadow-[0_0_0_6px_rgba(238,242,255,1)] group-hover:shadow-[0_0_0_10px_rgba(224,231,255,0.7)] transition-all duration-500 group-hover:-translate-y-2">
                <ImageIcon className="w-12 h-12 text-indigo-600 group-hover:text-indigo-700 transition-colors duration-500" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">
                Upload your masterpiece
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
                Drag and drop your image here or click to browse. We recommend high-resolution images for the best results.
              </p>
              
              <div className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold text-sm shadow-xl shadow-indigo-600/20 group-hover:bg-indigo-700 group-hover:-translate-y-0.5 transition-all duration-300">
                Browse Files
              </div>
            </div>
            
            <input type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleImageUpload} />
          </label>
        ) : (
          <div className="max-w-full max-h-full rounded-3xl shadow-2xl shadow-slate-400/30 border border-white bg-white/50 p-2 flex items-center justify-center overflow-hidden relative group backdrop-blur-sm">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/40 to-purple-100/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
             <canvas ref={canvasRef} className="max-w-full max-h-[80vh] object-contain block rounded-2xl relative z-10 shadow-sm" />
             <button 
                onClick={() => setImage(null)}
                className="absolute top-6 right-6 z-20 bg-black/50 hover:bg-black text-white p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg opacity-0 group-hover:opacity-100"
             >
                <X className="w-4 h-4" />
             </button>
          </div>
        )}
      </main>

      {/* Floating Control Panel */}
      <aside className={`absolute top-6 right-6 bottom-6 w-[420px] bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-100 flex flex-col z-30 transition-transform duration-500 ${!image ? 'translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'}`}>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
           {/* Section 1: Location */}
           <section>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Crosshair className="w-4 h-4" />
                 </div>
                 <h2 className="text-sm font-bold text-slate-800">Set Location</h2>
              </div>

              {/* Search Bar with Dropdown */}
              <div className="relative mb-4">
                 <form onSubmit={handleSearch} className="relative flex gap-2">
                    <div className="relative flex-1">
                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400" />
                       </div>
                       <input
                          type="text"
                          className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none shadow-sm"
                          placeholder="Search for a place..."
                          value={searchQuery}
                          onChange={(e) => {
                             setSearchQuery(e.target.value);
                             setIsDropdownOpen(false);
                          }}
                       />
                    </div>
                    <button 
                       type="submit" 
                       disabled={isSearching}
                       className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-70 shadow-md shadow-indigo-200 flex-shrink-0"
                    >
                       {isSearching ? '...' : 'Find'}
                    </button>
                 </form>

                 {/* Dropdown Results */}
                 {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
                       {searchResults.length > 0 ? (
                          searchResults.map((result, idx) => (
                             <button
                                key={idx}
                                onClick={() => selectSearchResult(result)}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex flex-col gap-1"
                             >
                                <span className="font-semibold text-slate-800 text-sm">{result.display_name.split(",")[0]}</span>
                                <span className="text-xs text-slate-500 line-clamp-1">{result.display_name}</span>
                             </button>
                          ))
                       ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center flex flex-col items-center gap-1">
                             <MapPin className="w-5 h-5 text-slate-300" />
                             <span>Lokasi "{searchQuery}" tidak ditemukan</span>
                          </div>
                       )}
                    </div>
                 )}
              </div>

              {/* Map Selection Tip */}
              <div className="text-[11px] text-slate-500 mb-3 flex items-center justify-between">
                <span>Or <strong>Right Click / Long Press</strong> on the map</span>
                <ChevronDown className="w-3 h-3" />
              </div>

              {/* Map */}
              <div className="h-48 rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative z-0">
                 <MapComponent position={locationData ? [locationData.lat, locationData.lng] : null} onLocationSelect={handleMapLocationSelect} />
                 {isSearching && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                       <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                 )}
              </div>

              {/* Active Location Display */}
              {locationData && (
                 <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <div className="mt-0.5">
                       <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm leading-tight">{locationData.name}</h3>
                       <p className="text-xs text-slate-600 mt-1 leading-snug">{locationData.address}</p>
                       <p className="text-[10px] text-indigo-500 font-mono mt-2 font-medium bg-indigo-100/50 inline-block px-2 py-1 rounded-md">
                          {locationData.lat.toFixed(5)}, {locationData.lng.toFixed(5)}
                       </p>
                    </div>
                 </div>
              )}
           </section>

           <hr className="border-slate-100" />

           {/* Section 2: Customization */}
           <section className={`transition-all duration-300 ${!locationData ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Palette className="w-4 h-4" />
                 </div>
                 <h2 className="text-sm font-bold text-slate-800">Appearance</h2>
              </div>

              <div className="space-y-6">
                 {/* Layout Template */}
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Layout Style</label>
                    <div className="grid grid-cols-4 gap-2">
                       {(['A', 'B', 'C', 'D'] as const).map((t) => (
                          <button
                             key={t}
                             onClick={() => setTemplate(t)}
                             className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                                template === t 
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                             }`}
                          >
                             Type {t}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Colors */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Background</label>
                       <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded-xl bg-white shadow-sm">
                          <input 
                             type="color" 
                             value={bgColor} 
                             onChange={(e) => setBgColor(e.target.value)}
                             className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                          />
                          <input 
                             type="text" 
                             value={bgColor}
                             onChange={(e) => setBgColor(e.target.value)}
                             className="w-full text-xs font-mono text-slate-700 bg-transparent outline-none px-1"
                          />
                       </div>
                    </div>
                    
                    <div>
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Text Color</label>
                       <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded-xl bg-white shadow-sm">
                          <input 
                             type="color" 
                             value={textColor} 
                             onChange={(e) => setTextColor(e.target.value)}
                             className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                          />
                          <input 
                             type="text" 
                             value={textColor}
                             onChange={(e) => setTextColor(e.target.value)}
                             className="w-full text-xs font-mono text-slate-700 bg-transparent outline-none px-1"
                          />
                       </div>
                    </div>
                 </div>

                 {/* Opacity */}
                 <div>
                    <div className="flex items-center justify-between mb-3">
                       <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Panel Opacity</label>
                       <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{bgOpacity}%</span>
                    </div>
                    <input 
                       type="range" 
                       min="0" max="100" 
                       value={bgOpacity} 
                       onChange={(e) => setBgOpacity(parseInt(e.target.value))}
                       className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                 </div>
              </div>
           </section>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 rounded-b-3xl">
           <button 
              onClick={handleDownload}
              disabled={!locationData || isGenerating}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold tracking-wide transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
           >
              <Download className="w-5 h-5" />
              {isGenerating ? 'Processing...' : 'Export Image'}
           </button>
        </div>
      </aside>
    </div>
  );
}
