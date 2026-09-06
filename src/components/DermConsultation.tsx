import React, { useState, useEffect, useRef } from "react";
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  UserCheck, 
  Star, 
  ShieldCheck, 
  AlertCircle, 
  Send, 
  Sparkles, 
  Check, 
  ChevronLeft, 
  ArrowLeft, 
  Home, 
  Loader2, 
  FileText,
  User
} from "lucide-react";
import { Dermatologist, Appointment, ChatMessage } from "../types";
import { formatINR } from "../lib/formatters";
import { DEMO_INDIAN_DERMATOLOGISTS } from "../data/skincareData";
import { getUserItem, setUserItem } from "../lib/userStorage";

interface DermConsultationProps {
  onNavigate?: (tab: string) => void;
  user?: { uid: string; displayName?: string; email?: string } | null;
}

export default function DermConsultation({ onNavigate, user }: DermConsultationProps) {
  // Verified Indian Dermatologists
  const doctors: Dermatologist[] = DEMO_INDIAN_DERMATOLOGISTS;

  // Active consultations / booked appointments - scoped to user
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Selected doctor for booking
  const [selectedDoc, setSelectedDoc] = useState<Dermatologist | null>(null);
  const [bookingType, setBookingType] = useState<"Video Call" | "Image Diagnostic Review" | "Priority Text Chat">("Video Call");
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-06");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Active Chat State
  const [activeChatDoctor, setActiveChatDoctor] = useState<Dermatologist>(doctors[0]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isDoctorTyping, setIsDoctorTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize or load user-scoped chat and appointments
  useEffect(() => {
    if (user?.uid) {
      const savedApts = getUserItem<Appointment[]>(user.uid, "appointments", []);
      setAppointments(savedApts);

      const savedChat = getUserItem<ChatMessage[]>(user.uid, "derm_chat_messages", []);
      if (savedChat.length > 0) {
        setChatMessages(savedChat);
      } else {
        // Welcome message tailored for new user
        const initialWelcome: ChatMessage[] = [
          {
            id: `msg-welcome-${Date.now()}`,
            sender: "doctor",
            text: `Hello ${user.displayName || "there"}! I am ${activeChatDoctor.name}, ${activeChatDoctor.qualification}. I am here to help answer your clinical skincare questions, guide you through active ingredients (like retinol, salicylic acid, or niacinamide), or review your daily routine. How can I assist you today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            prescriptionNote: "Clinical Advice: Tell me about your skin type and current concerns for a personalized recommendation."
          }
        ];
        setChatMessages(initialWelcome);
        setUserItem(user.uid, "derm_chat_messages", initialWelcome);
      }
    } else {
      // Guest state
      setAppointments([]);
      setChatMessages([
        {
          id: "guest-welcome",
          sender: "doctor",
          text: `Hello! I am ${activeChatDoctor.name}. How can I assist your skin health journey today? Feel free to ask about active ingredients, breakouts, or product layering order.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [user?.uid, activeChatDoctor.name]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isDoctorTyping]);

  const handleOpenBooking = (doc: Dermatologist) => {
    setSelectedDoc(doc);
    setSelectedSlot(doc.availableSlots && doc.availableSlots.length > 0 ? doc.availableSlots[0] : "10:00 AM");
    setBookingSuccess(false);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !selectedSlot) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      doctor: selectedDoc,
      date: selectedDate,
      timeSlot: selectedSlot,
      type: bookingType,
      status: "Confirmed",
      notes: bookingNotes || "General skin diagnostic consultation",
      createdAt: new Date().toISOString()
    };

    const updated = [newApt, ...appointments];
    setAppointments(updated);
    if (user?.uid) {
      setUserItem(user.uid, "appointments", updated);
    }

    setActiveChatDoctor(selectedDoc);
    setBookingSuccess(true);
    setTimeout(() => {
      setShowBookingModal(false);
      setBookingSuccess(false);
    }, 1500);
  };

  /**
   * High-precision clinical response fallback if backend is offline
   */
  const getContextualDoctorResponse = (query: string, docName: string) => {
    const q = query.toLowerCase();

    if (q.includes("retinol") || q.includes("tretinoin") || q.includes("retinoid") || q.includes("wrinkle")) {
      return {
        reply: `When introducing retinol, begin slowly to build retinoid tolerance and avoid barrier disruption. Use a low concentration (0.2%–0.3%) only 2 nights a week for the first 3 weeks, strictly in your PM routine on dry skin. If you experience flaking, use the 'sandwich method'—moisturizer, retinol, then moisturizer again. And always wear broad-spectrum SPF 50 every morning.`,
        note: "Clinical Guideline: 0.2% Encapsulated Retinol twice weekly. Never layer with AHA/BHA or Vitamin C on the same evening."
      };
    }

    if (q.includes("salicylic") || q.includes("bha") || q.includes("acne") || q.includes("pimple") || q.includes("breakout") || q.includes("blackhead")) {
      return {
        reply: `For active breakouts and congested pores, Salicylic Acid (BHA) is lipid-soluble, penetrating deep inside sebaceous glands to dissolve sebum and micro-comedones. Apply a 2% BHA solution 2 to 3 evenings per week after gentle cleansing. A mild purging period for 2-3 weeks is normal as trapped impurities come to the surface. Protect your moisture barrier with ceramides so your skin doesn't overproduce rebound oil.`,
        note: "Clinical Advice: 2% BHA solution 2-3 nights/week. Follow with 4% Niacinamide to soothe post-inflammatory erythema."
      };
    }

    if (q.includes("vitamin c") || q.includes("dark spot") || q.includes("pigment") || q.includes("melasma") || q.includes("brighten") || q.includes("glow")) {
      return {
        reply: `Vitamin C is an exceptional antioxidant that inhibits tyrosinase activity to fade hyperpigmentation while scavenging free radicals from UV exposure. Apply 10%–15% L-Ascorbic Acid or ethylated Vitamin C in your morning routine directly onto clean skin before moisturizer and sunscreen. Vitamin C and sunscreen work synergistically to boost photoprotection.`,
        note: "Prescription Advice: 10% Vitamin C + 0.5% Ferulic Acid serum every morning under SPF 50+ PA++++."
      };
    }

    if (q.includes("redness") || q.includes("burn") || q.includes("sting") || q.includes("barrier") || q.includes("sensitive") || q.includes("itch")) {
      return {
        reply: `Stinging or persistent redness indicates your epidermal lipid barrier is compromised, causing transepidermal moisture loss. Immediately pause all chemical exfoliants, retinol, and harsh foaming cleansers. Focus solely on barrier repair: wash with lukewarm water and a soap-free gentle cleanser, then apply multi-ceramide, squalane, and centella asiatica creams twice daily until comfort is restored.`,
        note: "Barrier Recovery Protocol: Strict 14-day hiatus on all active acids. Apply Ceramide NP + Centella recovery balm twice daily."
      };
    }

    if (q.includes("sunscreen") || q.includes("spf") || q.includes("sun damage") || q.includes("tan")) {
      return {
        reply: `Daily broad-spectrum sunscreen with SPF 50+ and PA++++ rating is the single most vital step in any dermatological routine. Apply two full finger lengths to cover face and neck, and reapply every 2 to 3 hours when outdoors. Look for formulas with Zinc Oxide or modern photostable chemical filters that leave no white cast.`,
        note: "Daily Protocol: Broad Spectrum SPF 50+ PA++++ every morning, rain or shine."
      };
    }

    if (q.includes("dry") || q.includes("tight") || q.includes("flake") || q.includes("peel")) {
      return {
        reply: `For dry, flaky skin, the priority is infusing hydration (humectants like hyaluronic acid and glycerin) and immediately locking it in with occlusives (ceramides and squalane). Apply your hydrating essence on damp skin immediately after cleansing, and avoid hot showers which strip natural skin lipids.`,
        note: "Hydration Advice: Layer multi-weight Hyaluronic Acid onto damp skin, followed by Ceramide barrier cream."
      };
    }

    if (q.includes("order") || q.includes("step") || q.includes("layer") || q.includes("routine")) {
      return {
        reply: `As a dermatological rule of thumb, layer products from thinnest consistency to thickest: 1. Cleanser, 2. Toner/Essence, 3. Lightweight Water-Based Treatment Serums, 4. Moisturizer/Creams, 5. Sunscreen (AM only). At night, double cleansing with an oil cleanser first ensures mineral sunscreen and pollution are dissolved without harsh scrubbing.`,
        note: "Routine Sequencing: Thinnest to thickest consistency; Sunscreen is always the final AM step."
      };
    }

    return {
      reply: `Thank you for sharing that question. As a clinical guideline, we recommend keeping your core routine simple: a gentle pH-balanced cleanser, targeted treatment active suited to your specific concern, barrier-restoring ceramide moisturizer, and daily broad-spectrum SPF 50+. Could you tell me more about your current routine and how long you have noticed this?`,
      note: "Clinical Triage Note: Consistency over 28 days is key to evaluating any dermatological treatment."
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputMessage.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedWithUser = [...chatMessages, userMsg];
    setChatMessages(updatedWithUser);
    setInputMessage("");
    setIsDoctorTyping(true);

    if (user?.uid) {
      setUserItem(user.uid, "derm_chat_messages", updatedWithUser);
    }

    try {
      // Call live /api/derm-chat endpoint
      const res = await fetch("/api/derm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: activeChatDoctor.name,
          doctorSpecialty: activeChatDoctor.specialist,
          doctorQualification: activeChatDoctor.qualification,
          userMessage: query,
          chatHistory: updatedWithUser.slice(-6)
        })
      });

      let doctorReplyText: string;
      let prescriptionNoteText: string | null = null;

      if (res.ok) {
        const data = await res.json();
        doctorReplyText = data.reply || getContextualDoctorResponse(query, activeChatDoctor.name).reply;
        prescriptionNoteText = data.prescriptionNote || getContextualDoctorResponse(query, activeChatDoctor.name).note;
      } else {
        const fallback = getContextualDoctorResponse(query, activeChatDoctor.name);
        doctorReplyText = fallback.reply;
        prescriptionNoteText = fallback.note;
      }

      const docReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "doctor",
        text: doctorReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        prescriptionNote: prescriptionNoteText || undefined
      };

      const finalMessages = [...updatedWithUser, docReply];
      setChatMessages(finalMessages);
      if (user?.uid) {
        setUserItem(user.uid, "derm_chat_messages", finalMessages);
      }
    } catch (err) {
      console.warn("Live derm chat error, using clinical fallback engine:", err);
      const fallback = getContextualDoctorResponse(query, activeChatDoctor.name);
      const docReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "doctor",
        text: fallback.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        prescriptionNote: fallback.note || undefined
      };

      const finalMessages = [...updatedWithUser, docReply];
      setChatMessages(finalMessages);
      if (user?.uid) {
        setUserItem(user.uid, "derm_chat_messages", finalMessages);
      }
    } finally {
      setIsDoctorTyping(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Universal Breadcrumb & Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-rose-100 p-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate("dashboard")}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
              Back to Dashboard
            </button>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600">
            Derm Consultation
          </span>
        </div>

        {/* Quick Jump Navigation Pills */}
        {onNavigate && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Quick Jump:</span>
            <button
              onClick={() => onNavigate("analyzer")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            >
              Skin Diagnostic
            </button>
            <button
              onClick={() => onNavigate("vision")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            >
              Vision Scan
            </button>
            <button
              onClick={() => onNavigate("routine")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            >
              Routine Planner
            </button>
            <button
              onClick={() => onNavigate("catalog")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            >
              Glow Catalog
            </button>
            <button
              onClick={() => onNavigate("journal")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            >
              Progress Journal
            </button>
            <button
              onClick={() => onNavigate("account")}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition-all cursor-pointer"
            >
              My Account
            </button>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <div className="border border-rose-100 bg-white p-6 md:p-8 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <Stethoscope className="h-5 w-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">Clinical Tele-Dermatology</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-slate-900">
            AI Dermatology Assistant &amp; Tele-Consultation
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Ask questions to board-certified dermatologists, explore customized clinical treatment advice, and book live video or audio consultations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Verified &amp; Secure Consultation
          </div>
        </div>
      </div>

      {/* Clinical Advisory Banner */}
      <div id="derm-emergency-notice" className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950">Clinical Advisory:</span> Online consultations are intended for non-emergency cosmetic, routine skin wellness, and lifestyle guidance. If you are experiencing an acute allergic reaction, severe facial swelling, or an emergency, please visit an urgent care facility or hospital immediately.
        </div>
      </div>

      {/* Grid Layout: Active Appointments & Doctor Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scheduled Appointments & Live Doctor Chat */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scheduled Appointments Card */}
          <div className="border border-rose-100 bg-white p-6 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-rose-500" />
                Your Booked Tele-Derm Consultations
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {appointments.length} Scheduled
              </span>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={apt.doctor.imageUrl} 
                        alt={apt.doctor.name} 
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-full object-cover border border-rose-100"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{apt.doctor.name}</h4>
                          <span className="text-[9px] font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                            Verified Specialist
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-600 font-medium">{apt.doctor.qualification}</p>
                        <p className="text-[11px] text-slate-500">{apt.doctor.specialist} • {apt.doctor.location}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-600">
                          <span>📅 {apt.date}</span>
                          <span>⏰ {apt.timeSlot}</span>
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-semibold">{apt.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => setActiveChatDoctor(apt.doctor)}
                        className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Open Live Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-rose-50/30 rounded-2xl border border-rose-100">
                <Calendar className="w-8 h-8 text-rose-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-800">No scheduled consultations yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select a specialist from the directory to book a video session or personalized regimen review.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Live Chat Window with Doctor */}
          <div className="border border-rose-100 bg-white p-6 rounded-3xl shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={activeChatDoctor.imageUrl} 
                    alt={activeChatDoctor.name} 
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-full object-cover border border-rose-100 shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{activeChatDoctor.name}</h3>
                    <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Active Consultation
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-600 font-medium">{activeChatDoctor.qualification}</p>
                  <p className="text-[10px] text-slate-500">{activeChatDoctor.specialist} • {activeChatDoctor.location}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                Online Now
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="h-80 overflow-y-auto space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-slate-900 text-white rounded-tr-none shadow-xs" 
                      : "bg-white text-slate-800 border border-rose-100 rounded-tl-none shadow-xs"
                  }`}>
                    <p>{msg.text}</p>
                    {msg.prescriptionNote && (
                      <div className="mt-2.5 pt-2 border-t border-rose-100 bg-rose-50/70 p-2 rounded-xl text-rose-800 font-mono text-[10px]">
                        <p className="font-bold">📋 {msg.prescriptionNote}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isDoctorTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2 bg-white rounded-xl border border-rose-100 w-fit">
                  <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                  <span className="text-[11px]">{activeChatDoctor.name} is formulating a clinical response...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Topic Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "How do I introduce Retinol safely?",
                "Can I mix Salicylic Acid with Niacinamide?",
                "How to repair a compromised skin barrier?",
                "What is the correct skincare layering order?",
                "Best sunscreen type for acne-prone skin?"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputMessage(suggestion)}
                  className="text-[10px] bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
              <input 
                id="input-derm-consult-message"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ${activeChatDoctor.name} about your routine or skin concerns...`}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400"
              />
              <button 
                id="btn-send-derm-message"
                type="submit"
                disabled={isDoctorTyping || !inputMessage.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dermatologists Directory */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-rose-100 bg-white p-6 rounded-3xl shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-rose-500" />
                  Verified Indian Dermatologists
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Top rated skin specialists available for tele-consultation</p>
              </div>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-semibold border border-rose-200">
                MD / DVD Faculty
              </span>
            </div>

            <div className="space-y-4">
              {doctors.map((doc) => (
                <div 
                  key={doc.id} 
                  className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl hover:border-rose-300 hover:bg-rose-50/20 transition-all space-y-3"
                >
                  <div className="flex gap-3.5 items-start">
                    <img 
                      src={doc.imageUrl} 
                      alt={doc.name} 
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded-2xl object-cover border border-rose-100 shrink-0 shadow-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">
                            {doc.name}
                          </h4>
                          <p className="text-xs text-rose-600 font-medium mt-0.5">
                            {doc.qualification}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold whitespace-nowrap shrink-0">
                          Verified Specialist
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        {doc.specialist} • {doc.location}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center text-amber-500 text-xs font-semibold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="ml-1 text-slate-800">{doc.rating}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {formatINR(doc.consultationFee)} / Session
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.specialties?.map((spec, i) => (
                      <span key={i} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-sans">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setActiveChatDoctor(doc)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeChatDoctor.id === doc.id
                          ? "bg-rose-50 border-rose-300 text-rose-700 font-bold"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {activeChatDoctor.id === doc.id ? "Chat Active" : "Ask in Chat"}
                    </button>

                    <button
                      onClick={() => handleOpenBooking(doc)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Book Consult
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedDoc.imageUrl} 
                  alt={selectedDoc.name} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-rose-100"
                />
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">{selectedDoc.name}</h3>
                  <p className="text-xs text-rose-600 font-medium">{selectedDoc.qualification}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-8 space-y-3 animate-fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Consultation Scheduled!</h4>
                <p className="text-xs text-slate-600">Your appointment has been confirmed and saved to your account profile.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Consultation Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Video Call", "Image Diagnostic Review", "Priority Text Chat"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBookingType(type)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-medium transition-all cursor-pointer ${
                          bookingType === type
                            ? "border-rose-500 bg-rose-50 text-rose-700 font-bold"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Date</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">Time Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      {selectedDoc.availableSlots?.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Clinical Notes or Current Concerns</label>
                  <textarea 
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Briefly describe your skin symptoms, any active ingredients you are using, or specific questions..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Consultation Fee</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{formatINR(selectedDoc.consultationFee)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Confirm &amp; Book
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
