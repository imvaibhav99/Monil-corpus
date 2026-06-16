import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import * as contractorService from '../service/contractor.service.js';
import * as categoryService from '../../category/service/category.service.js';
import * as cityService from '../../city/service/city.service.js';
import balluLogo from '../../../assets/ballu-logo.png';
import balluName from '../../../assets/name.png';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultHours = () =>
  Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '18:00', closed: false }]));

const emptyForm = () => ({
  businessName: '',
  bio: '',
  yearsExperience: '',
  languages: '',
  cityId: '',
  pincode: '',
  address: '',
  serviceRadiusKm: '',
  profilePhotoUrl: '',
  coverPhotoUrl: '',
  emergencyService: false,
  workingHours: defaultHours(),
  selectedCategoryIds: [],
  primaryCategoryId: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactEmail: '',
  contactTelegram: '',
  contactPreferredChannel: 'whatsapp',
});

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
      <h2 className="font-extrabold text-gray-900 text-lg mb-5 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label} {hint && <span className="font-normal text-gray-400 text-xs">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ContractorProfileEdit() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState(emptyForm());
  const [categories, setCategories] = useState([]);
  const [cities, setCities]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(null);
  const [error, setError]       = useState(null);

  useEffect(() => {
    Promise.all([
      contractorService.getMyProfile().catch(() => null),
      categoryService.getCategories(),
      cityService.getCities(),
    ]).then(([profileRes, catRes, cityRes]) => {
      setCategories(Array.isArray(catRes) ? catRes : catRes.data || []);
      setCities(Array.isArray(cityRes) ? cityRes : cityRes.data || []);

      if (profileRes) {
        const p = profileRes.data || profileRes;
        const existingCats = p.categories || [];
        const selectedIds = existingCats.map(c => {
          const id = c.categoryId;
          return typeof id === 'object' ? (id._id || id.id || id) : id;
        });
        const primaryId = (() => {
          const pc = existingCats.find(c => c.primary);
          if (!pc) return '';
          const id = pc.categoryId;
          return typeof id === 'object' ? (id._id || id.id || id) : id;
        })();

        setForm({
          businessName:            p.businessName || '',
          bio:                     p.bio || '',
          yearsExperience:         p.yearsExperience ?? '',
          languages:               Array.isArray(p.languages) ? p.languages.join(', ') : '',
          cityId:                  p.city?._id || p.city?.id || p.cityId || '',
          pincode:                 p.pincode || '',
          address:                 p.address || '',
          serviceRadiusKm:         p.serviceRadiusKm ?? '',
          profilePhotoUrl:         p.profilePhotoUrl || '',
          coverPhotoUrl:           p.coverPhotoUrl || '',
          emergencyService:        !!p.emergencyService,
          workingHours:            p.workingHours || defaultHours(),
          selectedCategoryIds:     selectedIds,
          primaryCategoryId:       primaryId,
          contactPhone:            p.contactChannels?.phone || '',
          contactWhatsapp:         p.contactChannels?.whatsapp || '',
          contactEmail:            p.contactChannels?.email || '',
          contactTelegram:         p.contactChannels?.telegram || '',
          contactPreferredChannel: p.contactChannels?.preferredChannel || 'whatsapp',
        });
      }
    }).catch(err => {
      setError(err.response?.data?.message || 'Failed to load data.');
    }).finally(() => setLoading(false));
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onCategoryToggle = (id) => {
    setForm(f => {
      const has = f.selectedCategoryIds.includes(id);
      const next = has ? f.selectedCategoryIds.filter(x => x !== id) : [...f.selectedCategoryIds, id];
      return {
        ...f,
        selectedCategoryIds: next,
        primaryCategoryId: has && f.primaryCategoryId === id ? '' : f.primaryCategoryId,
      };
    });
  };

  const onHoursChange = (day, field, value) => {
    setForm(f => ({
      ...f,
      workingHours: {
        ...f.workingHours,
        [day]: { ...f.workingHours[day], [field]: value },
      },
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    const payload = {
      businessName:    form.businessName,
      bio:             form.bio,
      yearsExperience: form.yearsExperience !== '' ? Number(form.yearsExperience) : undefined,
      languages:       form.languages ? form.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
      cityId:          form.cityId || undefined,
      pincode:         form.pincode || undefined,
      address:         form.address || undefined,
      serviceRadiusKm: form.serviceRadiusKm !== '' ? Number(form.serviceRadiusKm) : undefined,
      profilePhotoUrl: form.profilePhotoUrl || undefined,
      coverPhotoUrl:   form.coverPhotoUrl || undefined,
      emergencyService: form.emergencyService,
      workingHours:    form.workingHours,
      categories:      form.selectedCategoryIds.map(id => ({
        categoryId: id,
        primary: id === form.primaryCategoryId,
      })),
      contactChannels: {
        phone: form.contactPhone || undefined,
        whatsapp: form.contactWhatsapp || undefined,
        email: form.contactEmail || undefined,
        telegram: form.contactTelegram || undefined,
        preferredChannel: form.contactPreferredChannel || undefined,
      },
    };

    try {
      const res = await contractorService.updateMyProfile(payload);
      const updated = res.data || res;
      setSuccess(`✓ Profile saved! Completeness: ${updated.stats?.profileCompleteness ?? updated.profileCompleteness ?? '?'}%`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => { await logout(); navigate('/', { replace: true }); };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={balluLogo} alt="Ballu" className="h-10 w-auto" />
            <img src={balluName} alt="Ballu Thekedar" className="h-12 w-auto" />
          </Link>
          <div className="flex-1" />
          <Link to="/contractor/home" className="text-sm text-gray-500 hover:text-blue-700 font-medium">
            ← Dashboard
          </Link>
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center font-bold text-white text-sm">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-red-600 font-medium hidden sm:block">
            Logout
          </button>
        </div>
      </header>

      {/* Page header */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-xs font-bold tracking-wider text-yellow-300 mb-1">CONTRACTOR PORTAL</div>
          <h1 className="text-2xl font-extrabold">Edit Your Profile</h1>
          <p className="text-sm text-blue-200 mt-1">A complete profile gets 3× more views from clients</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8 w-full flex-1">
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-40 border border-gray-200" />)}
          </div>
        )}

        {!loading && (
          <form onSubmit={onSubmit} className="space-y-0">

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                ✓ {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <Section title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Business Name">
                  <input className={inputCls} name="businessName" value={form.businessName} onChange={onChange} placeholder="Your business name" />
                </Field>
                <Field label="Years of Experience">
                  <input className={inputCls} name="yearsExperience" type="number" min="0" value={form.yearsExperience} onChange={onChange} placeholder="5" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Bio" hint="max 500 chars">
                  <textarea
                    className={inputCls}
                    name="bio"
                    value={form.bio}
                    onChange={onChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Tell clients about yourself and your services…"
                  />
                  <span className="text-xs text-gray-400 text-right">{form.bio.length}/500</span>
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Languages" hint="comma-separated">
                  <input className={inputCls} name="languages" value={form.languages} onChange={onChange} placeholder="English, Hindi, Marathi" />
                </Field>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emergencyService"
                    checked={form.emergencyService}
                    onChange={onChange}
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm font-semibold text-gray-700">Available for emergency / urgent requests</span>
                </label>
              </div>
            </Section>

            {/* Location */}
            <Section title="Location & Service Area">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="City">
                  <select className={inputCls} name="cityId" value={form.cityId} onChange={onChange}>
                    <option value="">Select city</option>
                    {cities.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Pincode">
                  <input className={inputCls} name="pincode" value={form.pincode} onChange={onChange} placeholder="400001" />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Street Address">
                  <input className={inputCls} name="address" value={form.address} onChange={onChange} placeholder="Street address" />
                </Field>
                <Field label="Service Radius (km)">
                  <input className={inputCls} name="serviceRadiusKm" type="number" min="0" value={form.serviceRadiusKm} onChange={onChange} placeholder="25" />
                </Field>
              </div>
            </Section>

            {/* Photos */}
            <Section title="Photos">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Profile Photo URL" hint="Cloudinary upload in Phase 4">
                  <input className={inputCls} name="profilePhotoUrl" value={form.profilePhotoUrl} onChange={onChange} placeholder="https://…" />
                  {form.profilePhotoUrl && (
                    <img src={form.profilePhotoUrl} alt="Preview" className="mt-2 w-20 h-20 rounded-full object-cover border border-gray-200" />
                  )}
                </Field>
                <Field label="Cover Photo URL">
                  <input className={inputCls} name="coverPhotoUrl" value={form.coverPhotoUrl} onChange={onChange} placeholder="https://…" />
                  {form.coverPhotoUrl && (
                    <img src={form.coverPhotoUrl} alt="Preview" className="mt-2 w-full h-24 rounded-xl object-cover border border-gray-200" />
                  )}
                </Field>
              </div>
            </Section>

            {/* Categories */}
            <Section title="Service Categories">
              <p className="text-sm text-gray-500 mb-4">Select all categories you work in. Mark one as your Primary.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map(cat => {
                  const id = cat.id || cat._id;
                  const selected = form.selectedCategoryIds.includes(id);
                  return (
                    <div
                      key={id}
                      onClick={() => onCategoryToggle(id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition ${
                        selected
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selected ? 'border-blue-700 bg-blue-700' : 'border-gray-300'
                        }`}>
                          {selected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      </div>
                      {selected && (
                        <label
                          className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="radio"
                            name="primaryCategoryId"
                            value={id}
                            checked={form.primaryCategoryId === id}
                            onChange={() => setForm(f => ({ ...f, primaryCategoryId: id }))}
                            className="accent-yellow-500"
                          />
                          <span className={form.primaryCategoryId === id ? 'text-yellow-600' : 'text-gray-400'}>
                            Primary
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
                {categories.length === 0 && <p className="text-sm text-gray-400">No categories available.</p>}
              </div>
            </Section>

            {/* Working Hours */}
            <Section title="Working Hours">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 font-semibold">
                      <th className="text-left py-2 pr-4">Day</th>
                      <th className="text-left py-2 pr-4">Opens</th>
                      <th className="text-left py-2 pr-4">Closes</th>
                      <th className="text-left py-2">Closed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {DAYS.map(day => {
                      const h = form.workingHours[day] || { open: '09:00', close: '18:00', closed: false };
                      return (
                        <tr key={day}>
                          <td className="py-2 pr-4 capitalize font-medium text-gray-700">{day}</td>
                          <td className="py-2 pr-4">
                            <input
                              type="time"
                              value={h.open}
                              onChange={e => onHoursChange(day, 'open', e.target.value)}
                              disabled={h.closed}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-700"
                            />
                          </td>
                          <td className="py-2 pr-4">
                            <input
                              type="time"
                              value={h.close}
                              onChange={e => onHoursChange(day, 'close', e.target.value)}
                              disabled={h.closed}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-700"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              type="checkbox"
                              checked={!!h.closed}
                              onChange={e => onHoursChange(day, 'closed', e.target.checked)}
                              className="w-4 h-4 accent-red-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Contact Information */}
            <Section title="📞 Contact Information">
              <p className="text-sm text-gray-600 mb-6">
                Provide your contact details so clients can reach you. Your phone and WhatsApp will be hidden from non-logged-in users for privacy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Phone Number" hint="visible only to logged-in clients">
                  <input
                    className={inputCls}
                    name="contactPhone"
                    type="tel"
                    value={form.contactPhone}
                    onChange={onChange}
                    placeholder="+91-9876543210"
                  />
                  <span className="text-xs text-gray-400">Format: +91-XXXXXXXXXX</span>
                </Field>
                <Field label="WhatsApp Number" hint="same as phone or different">
                  <input
                    className={inputCls}
                    name="contactWhatsapp"
                    type="tel"
                    value={form.contactWhatsapp}
                    onChange={onChange}
                    placeholder="+91-9876543210"
                  />
                  <span className="text-xs text-gray-400">Clients can message you directly</span>
                </Field>
                <Field label="Contact Email" hint="separate from login email">
                  <input
                    className={inputCls}
                    name="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={onChange}
                    placeholder="contact@example.com"
                  />
                  <span className="text-xs text-gray-400">Can be different from login email</span>
                </Field>
                <Field label="Telegram Handle" hint="optional">
                  <input
                    className={inputCls}
                    name="contactTelegram"
                    value={form.contactTelegram}
                    onChange={onChange}
                    placeholder="@username"
                  />
                  <span className="text-xs text-gray-400">Your Telegram username (without @)</span>
                </Field>
              </div>

              {/* Preferred Channel */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <label className="text-sm font-semibold text-gray-700 block mb-3">Preferred Contact Channel</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'phone', label: '📱 Phone', icon: '☎️' },
                    { value: 'whatsapp', label: '💬 WhatsApp', icon: '💬' },
                    { value: 'email', label: '📧 Email', icon: '📧' },
                    { value: 'telegram', label: '✈️ Telegram', icon: '✈️' },
                  ].map(ch => (
                    <label
                      key={ch.value}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 cursor-pointer transition ${
                        form.contactPreferredChannel === ch.value
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="contactPreferredChannel"
                        value={ch.value}
                        checked={form.contactPreferredChannel === ch.value}
                        onChange={onChange}
                        className="accent-blue-700"
                      />
                      <span className="text-xs font-semibold text-gray-700">{ch.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            {/* Save */}
            <div className="flex gap-3 pb-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
              <Link
                to="/contractor/home"
                className="bg-gray-100 hover:bg-gray-200 !text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white mt-6">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <img src={balluLogo} alt="Ballu" className="h-8 w-8 rounded-full bg-white p-0.5" />
            <span className="font-bold">Ballu Thekedar</span>
          </div>
          <div className="text-blue-200 text-xs">© {new Date().getFullYear()} Ballu Thekedar. Ghar ka kaam, aasaan.</div>
          <button onClick={onLogout} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-1.5 rounded-full text-xs">
            Logout
          </button>
        </div>
      </footer>
    </div>
  );
}
