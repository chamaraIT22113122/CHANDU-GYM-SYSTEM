"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin, Calendar, ArrowLeft, Camera, Loader2, Edit3, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";

export default function MemberProfilePage() {
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch("/api/members/me");
        if (res.ok) {
          const data = await res.json();
          setMember(data);
        }
      } catch (err) {
        console.error("Failed to fetch member", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload to storage
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (uploadRes.ok && uploadData.url) {
        // 2. Update member DB
        const updateRes = await fetch("/api/members/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: uploadData.url }),
        });

        if (updateRes.ok) {
          setMember({ ...member, imageUrl: uploadData.url });
        } else {
          alert("Failed to update profile.");
        }
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        const updated = await res.json();
        setMember(updated);
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    } finally {
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gym-primary" />
      </div>
    );
  }

  if (!member) {
    return <div className="text-center p-10 text-white">Profile not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/member" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>
        <button 
          onClick={() => {
            setEditFormData(member);
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 bg-gym-primary/10 text-gym-primary hover:bg-gym-primary hover:text-black font-medium text-sm rounded-xl transition-colors flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" /> Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main profile card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-gym-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-gym-primary/20 to-blue-500/20 relative"></div>
            <div className="px-6 pb-6 relative flex flex-col items-center">
              
              <div className="w-24 h-24 rounded-full border-4 border-gym-card bg-gray-800 absolute -top-12 left-1/2 -translate-x-1/2 overflow-hidden flex items-center justify-center group">
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-gray-500" />
                )}
                
                {/* Hover overlay for upload */}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              <div className="mt-14 text-center">
                <h2 className="text-2xl font-bold text-white">{member.firstName} {member.lastName}</h2>
                <p className="text-gym-primary font-medium">{member.membershipId || member.id}</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${member.memberships?.[0]?.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {member.memberships?.[0]?.status || 'NO PLAN'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-gym-card rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email Address</p>
                  <p className="text-sm text-gray-200">{member.email || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                  <p className="text-sm text-gray-200">{member.phone || 'Not Provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Address</p>
                  <p className="text-sm text-gray-200">123 Gym Street, Fitness City, Colombo</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Joined Date</p>
                  <p className="text-sm text-gray-200">{new Date(member.joinDate).toLocaleDateString()}</p>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-gym-card rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">Physical Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-black/20 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">Height</p>
                <p className="text-xl font-bold text-white">{member.height || '--'} <span className="text-sm text-gray-400 font-normal">cm</span></p>
              </div>
              <div className="p-4 bg-black/20 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">Weight</p>
                <p className="text-xl font-bold text-white">{member.weight || '--'} <span className="text-sm text-gray-400 font-normal">kg</span></p>
              </div>
              <div className="p-4 bg-black/20 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">Target Weight</p>
                <p className="text-xl font-bold text-white">{member.targetWeight || '--'} <span className="text-sm text-gray-400 font-normal">kg</span></p>
              </div>
              <div className="p-4 bg-black/20 rounded-xl text-center">
                <p className="text-xs text-gray-500 mb-1">Goal</p>
                <p className="text-sm font-bold text-gym-primary mt-1">Stay Fit</p>
              </div>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gym-card border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Height (cm)</label>
                  <input type="number" step="0.1" value={editFormData.height || ""} onChange={e => setEditFormData({...editFormData, height: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Current Weight (kg)</label>
                  <input type="number" step="0.1" value={editFormData.weight || ""} onChange={e => setEditFormData({...editFormData, weight: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Target Weight (kg)</label>
                  <input type="number" step="0.1" value={editFormData.targetWeight || ""} onChange={e => setEditFormData({...editFormData, targetWeight: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 rounded-xl font-medium text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isEditing} className="px-6 py-2 bg-gym-primary text-black rounded-xl font-bold hover:bg-gym-primary/90 transition-colors flex items-center gap-2">
                    {isEditing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
