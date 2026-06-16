import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import * as categoryService from "../../category/service/category.service.js";
import * as cityService from "../../city/service/city.service.js";
import balluLogo from "../../../assets/ballu-logo.png";
import balluName from "../../../assets/name.png";

const quickActions = [
  { label: "Plumbing",   icon: "🔧", slug: "plumbing" },
  { label: "Electrical", icon: "⚡", slug: "electrical" },
  { label: "Painting",   icon: "🖌️", slug: "painting" },
  { label: "Carpentry",  icon: "🪚", slug: "carpentry" },
  { label: "AC Repair",  icon: "❄️", slug: "ac-repair" },
  { label: "Cleaning",   icon: "🧹", slug: "cleaning" },
];

const featuredThekedars = [
  { name: "Suresh Kumar", role: "Plumber",     city: "Pune",       rating: 4.9, reviews: 210, img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400" },
  { name: "Anil Verma",   role: "Electrician", city: "Delhi",      rating: 4.8, reviews: 185, img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400" },
  { name: "Mohan Lal",    role: "Painter",     city: "Mumbai",     rating: 4.9, reviews: 302, img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400" },
  { name: "Vikram Singh", role: "Carpenter",   city: "Jaipur",     rating: 4.7, reviews: 158, img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400" },
];

const trendingServices = [
  { title: "Deep Home Cleaning",  price: "Starting ₹999",   badge: "+24%", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500" },
  { title: "AC Repair & Service", price: "Starting ₹499",   badge: "+18%", img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500" },
  { title: "Full Home Painting",  price: "Starting ₹4,999", badge: "+32%", img: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500" },
  { title: "Electrical Fixes",    price: "Starting ₹299",   badge: "+12%", img: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500" },
];

const recentJobs = [
  { tag: "Urgent", time: "2h ago", title: "Bathroom Plumbing Fix", location: "Koregaon Park, Pune",   budget: "₹2,000 - ₹3,500" },
  { tag: "New",    time: "5h ago", title: "2BHK Wall Painting",    location: "Andheri West, Mumbai",  budget: "₹8,000 - ₹12,000" },
  { tag: "Open",   time: "1d ago", title: "Kitchen Cabinet Work",  location: "Whitefield, Bengaluru", budget: "₹15,000 - ₹25,000" },
];

const testimonials = [
  { initials: "RP", color: "bg-yellow-400", name: "Rajesh Patel", city: "Pune",   text: "Bahut badhiya service! Plumber time pe aaya aur kaam ekdum perfect kiya." },
  { initials: "SK", color: "bg-yellow-400", name: "Sneha Kapoor", city: "Delhi",  text: "Painting ka kaam superb tha. Ballu pe trust kar sakte ho 100%." },
  { initials: "AM", color: "bg-yellow-400", name: "Arjun Mehta",  city: "Mumbai", text: "Electrician ne ekdum fast kaam kiya. Price bhi fair tha. Recommended!" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dbCategories, setDbCategories] = useState([]);
  const [searchCat, setSearchCat] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => setDbCategories(Array.isArray(res) ? res : res.data || []))
      .catch(() => {});
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCat) params.set("categorySlug", searchCat);
    if (searchQuery) params.set("q", searchQuery);
    navigate(`/contractors${params.toString() ? "?" + params.toString() : ""}`);
  };

  // Redirect already-logged-in users to their dashboard
  if (user) {
    if (user.role === "CLIENT")      return <Navigate to="/client/home" replace />;
    if (user.role === "CONTRACTOR")  return <Navigate to="/contractor/home" replace />;
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN")
      return <Navigate to="/admin/home" replace />;
  }

  const allCategories = ["All", ...dbCategories.map((c) => c.name)];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Helpline bar */}
      <div className="w-full bg-yellow-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center text-gray-900">
          <span>📞 Helpline: 1800-BALLU-99</span>
          <span>📍 Serving in Indore and Bhopal</span>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu Thekedar" className="h-12 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-14 w-auto" />
          </div>

          <form
            onSubmit={onSearch}
            className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 gap-3"
          >
            <select
              value={searchCat}
              onChange={(e) => setSearchCat(e.target.value)}
              className="bg-transparent text-sm outline-none border-r border-gray-300 pr-3"
            >
              <option value="">All Categories</option>
              {dbCategories.map((c) => (
                <option key={c._id || c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for services or contractors..."
              className="bg-transparent flex-1 outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-5 py-1.5 rounded-full text-sm"
            >
              Search
            </button>
          </form>

          <Link
            to="/client/login"
            className="text-sm font-medium text-gray-700 hover:text-blue-700"
          >
            Login
          </Link>
          <Link
            to="/client/signup"
            className="bg-blue-700 hover:bg-blue-800 !text-white font-semibold px-5 py-2 rounded-full text-sm"
          >
            Post a Job
          </Link>
        </div>

        {/* Category tabs */}
        <div className="max-w-7xl mx-auto px-6 pb-3 flex gap-2 overflow-x-auto">
          {allCategories.map((c, i) => (
            <button
              key={c}
              onClick={() => {
                if (i === 0) navigate("/contractors");
                else {
                  const cat = dbCategories.find((d) => d.name === c);
                  navigate(cat ? `/contractors?categorySlug=${cat.slug}` : "/contractors");
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                i === 0
                  ? "bg-yellow-400 text-gray-900 font-semibold"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Yellow hero card */}
        <div className="lg:col-span-2 bg-yellow-400 rounded-2xl p-8 relative overflow-hidden">
          <div className="text-xs font-bold tracking-wider text-gray-900/80 mb-3">
            INDIA'S #1 CONTRACTOR MARKETPLACE
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
            Ghar ka kaam? <span className="text-red-600">Ballu</span>se kaam.
          </h1>
          <p className="mt-4 text-gray-800 max-w-xl">
            Trusted, verified thekedars for every home project. Compare, chat and hire in minutes.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">
            <div className="bg-white/90 rounded-xl px-5 py-3 text-center min-w-[110px]">
              <div className="text-xl font-extrabold">4.9★</div>
              <div className="text-[11px] text-gray-600">Avg Rating</div>
            </div>
            <div className="bg-white/90 rounded-xl px-5 py-3 text-center min-w-[110px]">
              <div className="text-xl font-extrabold">12,000+</div>
              <div className="text-[11px] text-gray-600">Verified Thekedars</div>
            </div>
            <div className="bg-white/90 rounded-xl px-5 py-3 text-center min-w-[110px]">
              <div className="text-xl font-extrabold">40+</div>
              <div className="text-[11px] text-gray-600">Cities</div>
            </div>
          </div>
        </div>

        {/* Blue mascot card */}
        <div className="bg-blue-700 rounded-2xl p-7 text-white relative overflow-hidden flex flex-col">
          <div className="w-20 h-20 rounded-full bg-white p-1 self-center mb-4">
            <img src={balluLogo} alt="Ballu" className="w-full h-full object-contain rounded-full" />
          </div>
          <p className="text-center font-bold text-lg mb-4">
            Main hoon Ballu — sahi thekedar dilwata hoon!
          </p>
          <ul className="text-sm space-y-1.5 mb-5">
            <li>✓ Free signup</li>
            <li>✓ Daily leads</li>
            <li>✓ ₹50k+/month avg</li>
          </ul>
          <div className="text-xs opacity-80 mb-3">14 thekedars joined this week</div>
          <Link
            to="/contractors"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 rounded-full text-center"
          >
            Find a Thekedar
          </Link>
        </div>
      </section>

      {/* Live ticker */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-blue-700 text-white rounded-full px-5 py-2.5 flex items-center gap-4 text-sm">
          <span className="bg-red-600 px-2.5 py-0.5 rounded-full text-xs font-bold">● LIVE</span>
          <span>⚡ Rajesh just hired a plumber in Pune  •  Priya posted a painting job in Delhi  •  38 jobs filled in the last hour</span>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-xs font-bold tracking-wider text-red-600 mb-1">GET STARTED</div>
        <h2 className="text-2xl font-extrabold mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(`/contractors?categorySlug=${a.slug}`)}
              className="bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 border border-gray-200 rounded-xl p-4 text-center transition"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-2 text-lg">
                {a.icon}
              </div>
              <div className="text-sm font-medium">{a.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Two CTAs */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-5 pb-10">
        <div className="bg-yellow-400 rounded-2xl p-6">
          <div className="text-xs font-bold tracking-wider text-gray-900/70 mb-2">FOR HOMEOWNERS</div>
          <h3 className="text-xl font-extrabold mb-2">Hire with confidence</h3>
          <p className="text-sm text-gray-800 mb-4">
            Browse verified profiles, read real reviews, and chat directly on WhatsApp.
          </p>
          <Link
            to="/contractors"
            className="inline-block bg-blue-700 hover:bg-blue-800 !text-white font-semibold px-5 py-2 rounded-full text-sm"
          >
            Find Contractors
          </Link>
        </div>
        <div className="bg-blue-700 rounded-2xl p-6 text-white">
          <div className="text-xs font-bold tracking-wider text-yellow-300 mb-2">FOR CONTRACTORS</div>
          <h3 className="text-xl font-extrabold mb-2">Grow your business</h3>
          <p className="text-sm text-blue-100 mb-4">
            Get matched with local jobs, build your reputation, and earn more every month.
          </p>
          <Link
            to="/contractor/signup"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-5 py-2 rounded-full text-sm"
          >
            Join as Thekedar
          </Link>
        </div>
      </section>

      {/* Featured Thekedars */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="flex justify-between items-end mb-5">
          <div>
            <div className="text-xs font-bold tracking-wider text-red-600 mb-1">TOP RATED</div>
            <h2 className="text-2xl font-extrabold">Featured Thekedars</h2>
          </div>
          <Link to="/contractors" className="text-sm text-blue-700 font-semibold hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredThekedars.map((t) => (
            <div key={t.name} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
              <div className="relative">
                <img src={t.img} alt={t.name} className="w-full h-56 object-cover" />
                <span className="absolute top-3 left-3 bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                  ● Online
                </span>
              </div>
              <div className="p-4">
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-gray-500 mb-2">
                  {t.role} · {t.city}
                </div>
                <div className="text-sm mb-3">
                  ⭐ {t.rating} <span className="text-gray-400">({t.reviews})</span>
                </div>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-full text-sm flex items-center justify-center gap-1">
                  💬 WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Services */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="text-xs font-bold tracking-wider text-red-600 mb-1">HOT RIGHT NOW</div>
        <h2 className="text-2xl font-extrabold mb-5">Trending Services</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingServices.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition"
            >
              <div className="relative">
                <img src={s.img} alt={s.title} className="w-full h-40 object-cover" />
                <span className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-full">
                  {s.badge}
                </span>
              </div>
              <div className="p-4">
                <div className="font-bold mb-1">{s.title}</div>
                <div className="text-sm text-gray-600">{s.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Posted Jobs */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="flex justify-between items-end mb-5">
          <div>
            <div className="text-xs font-bold tracking-wider text-red-600 mb-1">OPEN NOW</div>
            <h2 className="text-2xl font-extrabold">Recently Posted Jobs</h2>
          </div>
          <Link to="/contractors" className="text-sm text-blue-700 font-semibold hover:underline">
            See All Jobs
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentJobs.map((j) => (
            <div
              key={j.title}
              className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    j.tag === "Urgent"
                      ? "bg-red-100 text-red-700"
                      : j.tag === "New"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {j.tag}
                </span>
                <span className="text-xs text-gray-400">{j.time}</span>
              </div>
              <div className="font-bold mb-2">{j.title}</div>
              <div className="text-xs text-gray-600 mb-1">📍 {j.location}</div>
              <div className="text-xs text-gray-600 mb-4">💰 Budget: {j.budget}</div>
              <Link
                to="/contractor/signup"
                className="block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded-full text-sm text-center"
              >
                Bid Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="text-xs font-bold tracking-wider text-red-600 mb-1">LOVED BY CUSTOMERS</div>
        <h2 className="text-2xl font-extrabold mb-5">What People Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div key={t.name} className="border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`${t.color} w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-900`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.city}</div>
                </div>
              </div>
              <div className="text-yellow-500 text-sm mb-2">★★★★★</div>
              <p className="text-sm text-gray-700">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Become a Contractor CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="bg-blue-700 rounded-2xl p-8 text-white flex items-center justify-between relative overflow-hidden">
          <div className="max-w-xl">
            <div className="text-xs font-bold tracking-wider text-yellow-300 mb-2">EARN WITH US</div>
            <h2 className="text-3xl font-extrabold mb-2">Become a Contractor</h2>
            <p className="text-sm text-blue-100 mb-4">
              Join thousands of thekedars growing their business with Ballu. Free signup, more jobs,
              better income.
            </p>
            <Link
              to="/contractor/signup"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2.5 rounded-full"
            >
              Register Now
            </Link>
          </div>
          <div className="w-28 h-28 rounded-full bg-white p-2 hidden md:block">
            <img src={balluLogo} alt="Ballu" className="w-full h-full object-contain rounded-full" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-700 text-blue-100 mt-6">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
          <div className="col-span-2">
            <div className="mb-3">
              <img src={balluLogo} alt="Ballu" className="h-16 w-16 rounded-full bg-white p-0.5" />
            </div>
            <p className="text-xs text-blue-200 max-w-xs">
              Ghar ka kaam, aasaan. India's trusted contractor marketplace.
            </p>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Services</div>
            <ul className="space-y-1.5 text-xs text-white">
              <li><Link to="/contractors?categorySlug=plumbing" className="!text-white hover:!text-yellow-300">Plumbing</Link></li>
              <li><Link to="/contractors?categorySlug=electrical" className="!text-white hover:!text-yellow-300">Electrical</Link></li>
              <li><Link to="/contractors?categorySlug=painting" className="!text-white hover:!text-yellow-300">Painting</Link></li>
              <li><Link to="/contractors?categorySlug=carpentry" className="!text-white hover:!text-yellow-300">Carpentry</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">Company</div>
            <ul className="space-y-1.5 text-xs text-white">
              <li>About Us</li>
              <li>Careers</li>
              <li>Blog</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">For Clients</div>
            <ul className="space-y-1.5 text-xs text-white">
              <li><Link to="/client/signup" className="!text-white hover:!text-yellow-300">Post a Job</Link></li>
              <li><Link to="/contractors" className="!text-white hover:!text-yellow-300">Find Thekedars</Link></li>
              <li>How It Works</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3">For Contractors</div>
            <ul className="space-y-1.5 text-xs text-white">
              <li><Link to="/contractor/signup" className="!text-white hover:!text-yellow-300">Join Now</Link></li>
              <li>Pricing</li>
              <li>Resources</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-600 py-4 text-center text-xs text-blue-200">
          © {new Date().getFullYear()} Ballu Thekedar. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
