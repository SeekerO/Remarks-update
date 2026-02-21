"use client";

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Globe, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import directoryData from './directory.json';

const ContactDirectory = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // CHANGED: Now stores a single string (region name) instead of an object
    const [activeRegion, setActiveRegion] = useState<string | null>(null);

    const [showAll, setShowAll] = useState(false);
    const fieldOffices = directoryData.contactinformation.fieldoffices[0];

    // UPDATED: Toggle logic to ensure only one is open
    const toggleRegion = (region: string) => {
        setActiveRegion(prev => (prev === region ? null : region));
    };

    const filteredRegions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return Object.entries(fieldOffices).filter(([regionName, details]) => {
            const matchesRegion = regionName.toLowerCase().includes(term);
            const matchesCity = details.city.some(city => city.toLowerCase().includes(term));
            return matchesRegion || matchesCity;
        });
    }, [searchTerm, fieldOffices]);

    const handleRedirect = ({ region, city }: { region: string; city: string }) => {
        const formattedRegion = region.toLowerCase().replace(/\s+/g, '');
        const formattedCity = city.toLowerCase().replace(/\s+/g, '');
        const officeCaps = formattedCity === "caraga" || "barmm" ? "Offices" : "offices";
        const url = `https://comelec.gov.ph/?r=ContactInformation/FieldOffices/CityMunicipalOffices/${formattedRegion + officeCaps}#${formattedCity}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            <div className="max-w-6xl mx-auto h-full overflow-auto px-4">
                {/* Header */}
                <header className="mb-8 lg:mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                COMELEC Directory
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl">
                                Search and navigate through field offices and regional contact points across the Philippines.
                            </p>
                        </div>

                        <div className="relative w-full md:w-80 lg:w-96">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search regions or cities..."
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Sidebar */}
                    <aside className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
                        <div className="sticky top-8 space-y-6">
                            <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">
                                Quick Resources
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                <QuickLink icon={<Building2 size={20} />} label="Main Office" href={directoryData.contactinformation.mainoffice[0].directory} color="bg-blue-600" />
                                <QuickLink icon={<Globe size={20} />} label="Regional Offices" href={directoryData.contactinformation.regionaloffices[0].href} color="bg-emerald-600" />
                                <QuickLink icon={<MapPin size={20} />} label="NCR Offices" href={directoryData.contactinformation.ncroffices[0].href} color="bg-purple-600" />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <section className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Field Offices Explorer
                            </h2>
                            <button onClick={() => setShowAll(!showAll)} className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                                {showAll ? "Collapse List" : `See All ${filteredRegions.length}`}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredRegions.length > 0 ? (
                                filteredRegions.slice(0, showAll ? undefined : 5).map(([region, details]) => {
                                    const isOpen = activeRegion === region;

                                    return (
                                        <div
                                            key={region}
                                            className={`group bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-300 
                                                ${isOpen
                                                    ? 'border-blue-500 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-500/30'}`}
                                        >
                                            <button
                                                onClick={() => toggleRegion(region)}
                                                className="w-full flex items-center justify-between p-5 text-left"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm transition-colors
                                                        ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                                                        {region.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg truncate capitalize">
                                                            {region}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                            {details.city.length} Cities / Municipalities
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 rotate-180' : 'text-slate-300'}`}>
                                                    <ChevronDown size={20} />
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="px-5 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                                        {details.city.map((city) => (
                                                            <button
                                                                key={city}
                                                                onClick={() => handleRedirect({ region, city })}
                                                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all text-left"
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                                <span className="text-sm text-slate-600 dark:text-slate-300 capitalize truncate">
                                                                    {city}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="inline-flex p-4 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 mb-4">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-bold text-lg">No offices found</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

const QuickLink = ({ icon, label, href, color }: { icon: React.ReactNode; label: string; href: string; color: string }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all group"
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${color} text-white shadow-lg shadow-inherit/20`}>{icon}</div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{label}</span>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </a>
);

export default ContactDirectory;