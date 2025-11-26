import React, { useState } from 'react';
import { supabase } from "./supabaseClient"; 
import { useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, RefreshCw, TrendingUp, TrendingDown, MessageSquare, FileText, Menu, X, Home, FileSpreadsheet, User, Trash2, MapPin, Heart, Smile, Frown, Meh, Activity, Target, Zap, Search, BarChart3, AlertCircle, Download } from 'lucide-react';

interface UploadedFile {
  id: number;
  name: string;
  
  size: string;
  date: string;
  status: string;
  rowCount: number;
}

interface FileDataRow {
  _id: number;
  [key: string]: any;
}  // make sure client is imported
const BrandPulseDashboard = () => {
  const [dateRange, setDateRange] = useState('30days');
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileData, setFileData] = useState<FileDataRow[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [recentFiles] = useState([
    { id: 1, name: 'customer_reviews_nov.csv', date: '2025-11-10' },
    { id: 2, name: 'social_media_oct.xlsx', date: '2025-10-28' },
    { id: 3, name: 'feedback_sept.csv', date: '2025-09-15' }
  ]);

  const [sentimentData] = useState([
    { name: 'Positive', value: 0, color: '#10b981' },
    { name: 'Neutral', value: 0, color: '#6b7280' },
    { name: 'Negative', value: 0, color: '#ef4444' }
  ]);

  const [emotionData] = useState([
    { name: 'Joy', value: 0, color: '#fbbf24' },
    { name: 'Trust', value: 0, color: '#3b82f6' },
    { name: 'Surprise', value: 0, color: '#8b5cf6' },
    { name: 'Sadness', value: 0, color: '#6366f1' },
    { name: 'Anger', value: 0, color: '#ef4444' },
    { name: 'Fear', value: 0, color: '#64748b' }
  ]);

  const [aspectData] = useState([
    { aspect: 'Product Quality', positive: 85, negative: 5, neutral: 10 },
    { aspect: 'Customer Service', positive: 30, negative: 45, neutral: 25 },
    { aspect: 'Delivery', positive: 70, negative: 15, neutral: 15 },
    { aspect: 'Price', positive: 40, negative: 30, neutral: 30 },
    { aspect: 'Offers', positive: 60, negative: 20, neutral: 20 }
  ]);

  const [geoData] = useState([
    { city: 'Mumbai', positive: 65, neutral: 20, negative: 15, status: 'Good' },
    { city: 'Delhi', positive: 40, neutral: 35, negative: 25, status: 'Needs Attention' },
    { city: 'Bangalore', positive: 75, neutral: 15, negative: 10, status: 'Excellent' },
    { city: 'Chennai', positive: 58, neutral: 27, negative: 15, status: 'Good' },
    { city: 'Kolkata', positive: 52, neutral: 28, negative: 20, status: 'Good' }
  ]);

  const [userName, setUserName] = useState("");
const [companyName, setCompanyName] = useState("");


  const brandScore = 0;
 const [trendDirection, setTrendDirection] = useState<
  "improving" | "stable" | "declining"
>("stable");

// 🟣 Load logged-in user + profile data
useEffect(() => {
  const loadUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth Error:", error);
      return;
    }

    if (!user) {
      console.warn("No logged-in user found");
      return;
    }

    console.log("Logged-in user:", user);

    // 👉 Fetch user profile from your "users" table (created by trigger)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("full_name,company_name,company_email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return;
    }

    console.log("Loaded profile:", profile);

    // 🔥 Set state (name + company)
    setUserName(profile?.full_name || "Guest User");
    setCompanyName(profile?.company_name || "Unknown Company");
  };

  loadUser();
}, []);



const uploadFileToSupabase = async (file: File, user: any) => {
  // 1️⃣ Upload to storage bucket
  const filePath = `${user.id}/${Date.now()}-${file.name}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from("uploaded_files")
    .upload(filePath, file);

  if (storageError) {
    console.error("Storage upload error:", storageError);
    alert("Failed to upload file");
    return null;
  }

  // 2️⃣ Get public file URL
  const { data: publicUrlData } = supabase.storage
    .from("uploaded_files")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  // 3️⃣ Insert into table
  const { data: insertData, error: insertError } = await supabase
    .from("uploaded_files")
    .insert({
      user_id: user.id,
      email: user.email,
      file_url: publicUrl,
      file_name: file.name
    })
    .select()
    .single();

  if (insertError) {
    console.error(" DB Insert error:", insertError);
    return null;
  }

  return insertData;
};



const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 1️⃣ Get logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("You must be logged in to upload files.");
    return;
  }

  // 2️⃣ Upload to Supabase Storage
  const filePath = `${user.id}/${Date.now()}-${file.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("uploaded_files")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Storage Upload Error:", uploadError);
    alert("Error uploading file to cloud storage.");
    return;
  }

  // 3️⃣ Get public URL
  const { data: publicData } = supabase.storage
    .from("uploaded_files")
    .getPublicUrl(filePath);

  const publicUrl = publicData.publicUrl;

  // 4️⃣ Insert database row
  const { data: dbInsert, error: dbError } = await supabase
    .from("uploaded_files")
    .insert({
      user_id: user.id,
      email: user.email,
      file_url: publicUrl,
      file_name: file.name
    })
    .select()
    .single();

  if (dbError) {
    console.error("DB Insert Error:", dbError);
    alert("Error saving file record in database.");
    return;
  }

  console.log("Saved in DB:", dbInsert);

  // 5️⃣ Continue your existing CSV parsing logic
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const text = e.target?.result;
      if (typeof text !== "string") return;

      const rows = text.split("\n").filter((row: string) => row.trim() !== "");

      if (rows.length === 0) {
        alert("File is empty");
        return;
      }

      const separator = rows[0].includes(";") ? ";" : ",";
      const headers = rows[0]
        .split(separator)
        .map((h: string) => h.trim().replace(/['"]/g, ""));

      const data = rows.slice(1).map((row: string, index: number) => {
        const values = row
          .split(separator)
          .map((v: string) => v.trim().replace(/['"]/g, ""));
        const rowData: FileDataRow = { _id: index + 1 };
        headers.forEach((header: string, i: number) => {
          rowData[header] = values[i] || "";
        });
        return rowData;
      });

      setFileHeaders(headers);
      setFileData(data);

      const newFile = {
        id: dbInsert.id, // use Supabase row id
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        date: dbInsert.created_at,
        status: "Uploaded",
        rowCount: data.length
      };

      setUploadedFiles([...uploadedFiles, newFile]);
      setSelectedFile(newFile.id);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Failed to read the file, ensure it is a valid CSV.");
    }
  };

  reader.readAsText(file);
};


  const handleAnalyzeFiles = () => {
    setUploadedFiles(uploadedFiles.map(file => 
      file.status === 'Uploaded' ? { ...file, status: 'Analyzing...' } : file
    ));
    
    setTimeout(() => {
      setUploadedFiles(uploadedFiles.map(file => 
        file.status === 'Analyzing...' ? { ...file, status: 'Analyzed' } : file
      ));
      alert('Analysis will be processed by ML models. Results will appear in the analytics sections.');
    }, 1000);
  };

  const handleClearFiles = () => {
    if (window.confirm('Are you sure you want to clear all uploaded files?')) {
      setUploadedFiles([]);
      setFileData([]);
      setFileHeaders([]);
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = (fileId: number) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      setFileData([]);
      setFileHeaders([]);
      setSelectedFile(null);
    }
  };

  const navigateTo = (section: string) => {
    setActiveSection(section);
  };

  const renderContent = () => {
    if (activeSection === 'overview') {
      return (
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload and Analyze Data</h3>
              <div className="flex items-center gap-2">
                {uploadedFiles.length > 0 && (
                  <button 
                    onClick={handleClearFiles}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>
                )}
                <button 
                  onClick={handleAnalyzeFiles}
                  disabled={uploadedFiles.length === 0}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${
                    uploadedFiles.length === 0 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Activity size={16} />
                  Analyze Data
                </button>
              </div>
            </div>
            
            {fileData.length > 0 ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Dataset Preview - {fileData.length} rows
                  </span>
                </div>
                <div className="overflow-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-300 bg-gray-100">#</th>
                        {fileHeaders.map((header, index) => (
                          <th key={index} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-300 bg-gray-100 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {fileData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={`border-b border-gray-200 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? 'white' : '#f9fafb'}>
                          <td className="px-4 py-3 text-gray-600 font-medium border-r border-gray-200">{rowIndex + 1}</td>
                          {fileHeaders.map((header, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-gray-700 border-r border-gray-200">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50 text-center mb-4">
                <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-sm text-gray-600 mb-2">No data uploaded</p>
                <p className="text-xs text-gray-500 mb-4">Upload CSV or Excel files with customer reviews</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer" style={{ color: '#62109F', backgroundColor: '#f3e8ff' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9d5ff'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}>
                  <Upload size={16} />
                  Choose File
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
                <div className="space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="text-green-600" size={20} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size} - {file.rowCount} rows</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          file.status === 'Analyzed' 
                            ? 'bg-green-100 text-green-700' 
                            : file.status === 'Analyzing...'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {file.status}
                        </span>
                        <button 
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="rounded-lg p-8 text-white" style={{ background: 'linear-gradient(to bottom right, #62109F, #8B1FB3)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold opacity-90">Brand Sentiment Score</h3>
                <Target className="opacity-75" size={32} />
              </div>
              <div className="text-6xl font-bold mb-2">{brandScore}/100</div>
              <p className="text-sm opacity-75">Overall brand health index</p>
            </div>

<div className="bg-white rounded-lg border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Direction</h3>
  <div className="flex items-center justify-center h-32">
    {trendDirection === "improving" && (
      <div className="text-center">
        <TrendingUp className="mx-auto text-green-600 mb-2" size={48} />
        <p className="text-xl font-semibold text-green-600">Improving</p>
      </div>
    )}

    {trendDirection === "stable" && (
      <div className="text-center">
        <Activity className="mx-auto text-blue-600 mb-2" size={48} />
        <p className="text-xl font-semibold text-blue-600">Stable</p>
      </div>
    )}

    {trendDirection === "declining" && (
      <div className="text-center">
        <TrendingDown className="mx-auto text-red-600 mb-2" size={48} />
        <p className="text-xl font-semibold text-red-600">Declining</p>
      </div>
    )}
  </div>
</div>


          </div>

          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {sentimentData.reduce((acc, curr) => acc + curr.value, 0)}
                  </p>
                </div>
                <MessageSquare size={32} style={{ color: '#62109F' }} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Positive</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {sentimentData[0]?.value || 0}
                  </p>
                </div>
                <Smile className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Neutral</p>
                  <p className="text-3xl font-bold text-gray-600 mt-2">
                    {sentimentData[1]?.value || 0}
                  </p>
                </div>
                <Meh className="text-gray-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Negative</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {sentimentData[2]?.value || 0}
                  </p>
                </div>
                <Frown className="text-red-600" size={32} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }) => name}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trend</h3>
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <TrendingUp className="mx-auto mb-3" size={48} />
                  <p className="text-sm">Trend data after analysis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis Results</h3>
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-sm">No analyzed data yet</p>
              <p className="text-xs mt-2">Upload and analyze files to see results</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'emotions') {
      return (
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Emotions Detected</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border-2 border-yellow-400 rounded-lg p-6 text-center bg-yellow-50">
                <div className="text-5xl mb-3">😊</div>
                <h4 className="font-semibold text-gray-900 mb-2">Joy</h4>
                <p className="text-4xl font-bold text-amber-600">35%</p>
              </div>
              <div className="rounded-lg p-6 text-center" style={{ border: '2px solid #62109F', backgroundColor: '#f3e8ff' }}>
                <div className="text-5xl mb-3">👍</div>
                <h4 className="font-semibold text-gray-900 mb-2">Trust</h4>
                <p className="text-4xl font-bold" style={{ color: '#62109F' }}>25%</p>
              </div>
              <div className="border-2 border-purple-400 rounded-lg p-6 text-center bg-purple-50">
                <div className="text-5xl mb-3">😲</div>
                <h4 className="font-semibold text-gray-900 mb-2">Surprise</h4>
                <p className="text-4xl font-bold text-purple-600">15%</p>
              </div>
              <div className="border-2 border-red-400 rounded-lg p-6 text-center bg-red-50">
                <div className="text-5xl mb-3">😠</div>
                <h4 className="font-semibold text-gray-900 mb-2">Anger</h4>
                <p className="text-4xl font-bold text-red-600">12%</p>
              </div>
              <div className="border-2 border-gray-400 rounded-lg p-6 text-center bg-gray-50">
                <div className="text-5xl mb-3">😟</div>
                <h4 className="font-semibold text-gray-900 mb-2">Sadness</h4>
                <p className="text-4xl font-bold text-gray-600">8%</p>
              </div>
              <div className="border-2 border-red-300 rounded-lg p-6 text-center bg-red-50">
                <div className="text-5xl mb-3">😨</div>
                <h4 className="font-semibold text-gray-900 mb-2">Fear</h4>
                <p className="text-4xl font-bold text-red-500">5%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} />
              Emotion Intensity Over Time
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Activity className="mx-auto mb-3" size={48} />
                <p className="text-sm">Time series data will appear after analysis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} />
              Sample Reviews by Emotion
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">😊</span>
                  <span className="font-semibold text-gray-900">Joy</span>
                </div>
                <p className="text-sm text-gray-700">"Absolutely loved the product! Fast delivery and excellent quality!"</p>
              </div>
              <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">😠</span>
                  <span className="font-semibold text-gray-900">Anger</span>
                </div>
                <p className="text-sm text-gray-700">"Terrible customer service. Waited 2 hours on hold with no resolution."</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded" style={{ borderLeft: '4px solid #62109F' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">👍</span>
                  <span className="font-semibold text-gray-900">Trust</span>
                </div>
                <p className="text-sm text-gray-700">"Been using this brand for years. Always reliable and trustworthy."</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'aspects') {
      return (
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Target size={20} />
              Top 5 Aspects Identified
            </h3>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery</h4>
                <p className="text-4xl font-bold mb-2" style={{ color: '#62109F' }}>70%</p>
                <p className="text-xs text-gray-500">Positive</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Price</h4>
                <p className="text-4xl font-bold mb-2" style={{ color: '#62109F' }}>40%</p>
                <p className="text-xs text-gray-500">Positive</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Service</h4>
                <p className="text-4xl font-bold mb-2" style={{ color: '#62109F' }}>30%</p>
                <p className="text-xs text-gray-500">Positive</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Product Quality</h4>
                <p className="text-4xl font-bold mb-2" style={{ color: '#62109F' }}>85%</p>
                <p className="text-xs text-gray-500">Positive</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Offers</h4>
                <p className="text-4xl font-bold mb-2" style={{ color: '#62109F' }}>60%</p>
                <p className="text-xs text-gray-500">Positive</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Aspect Sentiment Comparison
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={aspectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="aspect" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" fill="#10b981" name="Positive" />
                <Bar dataKey="neutral" fill="#6b7280" name="Neutral" />
                <Bar dataKey="negative" fill="#ef4444" name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (activeSection === 'forecasting') {
      return (
        <div>
          <div className="rounded-lg p-8 text-white mb-6" style={{ background: 'linear-gradient(to right, #7c3aed, #62109F)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Zap size={32} />
              <div>
                <h3 className="text-2xl font-bold">7-Day Sentiment Forecast</h3>
                <p className="text-purple-100 text-sm">Predicted sentiment trends for the next week</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecasted Sentiment Trend</h3>
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-3 text-teal-500" size={64} />
                <p className="text-sm text-gray-600">Forecast chart will show predicted positive and negative sentiment</p>
                <p className="text-xs text-gray-400 mt-2">Uses time series analysis and ML models</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="border-2 border-yellow-300 rounded-lg p-6 bg-yellow-50">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-yellow-600" size={32} />
                <h4 className="font-semibold text-gray-900">Risk Days</h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">Days 11-12: Expected spike in negative sentiment</p>
              <p className="text-xs text-gray-500">Prepare PR response</p>
            </div>

            <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="text-green-600" size={32} />
                <h4 className="font-semibold text-gray-900">Positive Volume</h4>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">+15%</p>
              <p className="text-xs text-gray-500">Expected increase</p>
            </div>

            <div className="rounded-lg p-6" style={{ border: '2px solid #62109F', backgroundColor: '#f3e8ff' }}>
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 size={32} style={{ color: '#62109F' }} />
                <h4 className="font-semibold text-gray-900">Model Confidence</h4>
              </div>
              <p className="text-3xl font-bold mb-2" style={{ color: '#62109F' }}>87%</p>
              <p className="text-xs text-gray-500">High accuracy</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'geo') {
      return (
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin size={20} />
              City-wise Sentiment Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">City</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">Positive %</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">Neutral %</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">Negative %</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {geoData.map((city, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-pink-500" size={18} />
                          <span className="font-medium text-gray-900">{city.city}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">{city.positive}%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600">{city.neutral}%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-red-600">{city.negative}%</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          city.status === 'Excellent' ? 'bg-green-100 text-green-700' :
                          city.status === 'Good' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {city.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Regional Comparison
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MapPin className="mx-auto mb-3" size={48} />
                <p className="text-sm">Regional heatmap visualization</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'voc') {
      return (
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText size={24} style={{ color: '#62109F' }} />
              <h3 className="text-lg font-semibold text-gray-900">Weekly Summary</h3>
            </div>
            <div className="rounded-lg p-6" style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe' }}>
              <p className="text-gray-800 leading-relaxed">
                "Joy emotion increased by +12% this week. Anger decreased after refund policy update. Delivery performance in Mumbai improved significantly. Price concerns remain in tier-2 cities."
              </p>
              <p className="text-xs text-gray-500 mt-4">Generated: Nov 15, 2025</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare size={24} style={{ color: '#62109F' }} />
              <h3 className="text-lg font-semibold text-gray-900">Top 5 Repeated Customer Concerns</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-red-600">#1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Delivery delays in metro cities</h4>
                  <p className="text-sm text-gray-600 mb-2">342 mentions</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-red-500" size={16} />
                    <span className="text-xs text-red-600 font-medium">up</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-orange-600">#2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Customer service response time</h4>
                  <p className="text-sm text-gray-600 mb-2">287 mentions</p>
                  <div className="flex items-center gap-2">
                    <Activity className="text-gray-500" size={16} />
                    <span className="text-xs text-gray-600 font-medium">stable</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-yellow-600">#3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Product pricing concerns</h4>
                  <p className="text-sm text-gray-600 mb-2">198 mentions</p>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="text-green-500" size={16} />
                    <span className="text-xs text-green-600 font-medium">down</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-blue-600">#4</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Packaging quality issues</h4>
                  <p className="text-sm text-gray-600 mb-2">156 mentions</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-red-500" size={16} />
                    <span className="text-xs text-red-600 font-medium">up</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-green-600">#5</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">App user experience</h4>
                  <p className="text-sm text-gray-600 mb-2">134 mentions</p>
                  <div className="flex items-center gap-2">
                    <Activity className="text-gray-500" size={16} />
                    <span className="text-xs text-gray-600 font-medium">stable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'explorer') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Search className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Raw Data Explorer</h3>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" onFocus={(e) => e.target.style.borderColor = '#62109F'} onBlur={(e) => e.target.style.borderColor = '#d1d5db'}>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emotion</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All</option>
                <option>Joy</option>
                <option>Trust</option>
                <option>Surprise</option>
                <option>Anger</option>
                <option>Sadness</option>
                <option>Fear</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All</option>
                <option>Positive</option>
                <option>Neutral</option>
                <option>Negative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Cities</option>
                <option>Mumbai</option>
                <option>Delhi</option>
                <option>Bangalore</option>
                <option>Chennai</option>
                <option>Kolkata</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button className="px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2" style={{ backgroundColor: '#62109F' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7a1abf'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#62109F'}>
              <Download size={16} />
              Download Filtered Data
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <RefreshCw size={16} />
              Reset Filters
            </button>
          </div>

          {fileData.length > 0 ? (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                <p className="text-sm font-semibold text-gray-700">
                  Showing {fileData.length} records
                </p>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-300">#</th>
                      {fileHeaders.map((header, index) => (
                        <th key={index} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-300 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {fileData.map((row, rowIndex) => (
                      <tr key={rowIndex} className={`border-b border-gray-200 hover:bg-indigo-50 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-3 text-gray-600 font-medium border-r border-gray-200">{rowIndex + 1}</td>
                        {fileHeaders.map((header, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 text-gray-700 border-r border-gray-200">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-sm">No data available</p>
              <p className="text-xs mt-2">Upload files from the Overview section to explore data</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#62109F' }}>
              <User className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{userName}</h3>
              <p className="text-xs text-gray-500">{companyName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#62109F' }}>
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Brand Pulse</h2>
              <p className="text-xs text-gray-500">Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => navigateTo('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'overview' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'overview' ? { backgroundColor: '#62109F' } : {}}
          >
            <Home size={18} />
            Overview
          </button>
          <button 
            onClick={() => navigateTo('emotions')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'emotions' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'emotions' ? { backgroundColor: '#62109F' } : {}}
          >
            <Heart size={18} />
            Emotions
          </button>
          <button 
            onClick={() => navigateTo('aspects')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'aspects' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'aspects' ? { backgroundColor: '#62109F' } : {}}
          >
            <Target size={18} />
            Aspects
          </button>
          <button 
            onClick={() => navigateTo('forecasting')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'forecasting' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'forecasting' ? { backgroundColor: '#62109F' } : {}}
          >
            <Zap size={18} />
            Forecasting
          </button>
          <button 
            onClick={() => navigateTo('geo')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'geo' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'geo' ? { backgroundColor: '#62109F' } : {}}
          >
            <MapPin size={18} />
            Geographic
          </button>
          <button 
            onClick={() => navigateTo('voc')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'voc' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'voc' ? { backgroundColor: '#62109F' } : {}}
          >
            <MessageSquare size={18} />
            Voice of Customer
          </button>
          <button 
            onClick={() => navigateTo('explorer')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${
              activeSection === 'explorer' ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={activeSection === 'explorer' ? { backgroundColor: '#62109F' } : {}}
          >
            <FileSpreadsheet size={18} />
            Data Explorer
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Recent Files</h3>
          <div className="space-y-1">
            {recentFiles.map(file => (
              <div key={file.id} className="px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
                <p className="font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-gray-400">{file.date}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Brand Pulse Dashboard</h1>
                  <p className="text-sm text-gray-500 mt-1">Sentiment Analysis System</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  onFocus={(e) => e.target.style.borderColor = '#62109F'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2" style={{ backgroundColor: '#62109F' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7a1abf'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#62109F'}>
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default BrandPulseDashboard;