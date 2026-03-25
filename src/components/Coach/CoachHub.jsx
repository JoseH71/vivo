import React, { useState, useEffect } from 'react';
import { Activity, Microscope, Loader2, Calendar, Search } from 'lucide-react';
import CoachActivityView from './CoachActivityView';
import CoachAnalysisView from './CoachAnalysisView';
import CoachMesoListView from './CoachMesoListView';
import CoachCorrelationsView from './CoachCorrelationsView';
import CoachLabView from './CoachLabView';
import { fetchIntervalsData } from '../../services/intervalsService';

const CoachHub = ({ intervalsData, dailyRecommendation, weeklyPlan, onUpdatePlan, onSwapSessions, onResetWeek, activeMesocycleData, allMesocycles }) => {
    const [subTab, setSubTab] = useState('activity');
    const [historyData, setHistoryData] = useState(intervalsData);

    useEffect(() => {
        if (!intervalsData || intervalsData.length === 0) {
            fetchIntervalsData().then(setHistoryData);
        }
    }, [intervalsData]);

    const renderSubView = () => {
        switch (subTab) {
            case 'activity': return <CoachActivityView intervalsData={historyData} dailyRecommendation={dailyRecommendation} activeMesocycleData={activeMesocycleData} weeklyPlan={weeklyPlan} onUpdatePlan={onUpdatePlan} onSwapSessions={onSwapSessions} onResetWeek={onResetWeek} allMesocycles={allMesocycles} />;
            case 'analysis': return <CoachAnalysisView historyData={historyData} />;
            case 'correlations': return <CoachCorrelationsView historyData={historyData} />;
            case 'lab': return <CoachLabView historyData={historyData} />;
            case 'plan': return <CoachMesoListView activeMesocycleData={activeMesocycleData} allMesocycles={allMesocycles} onSwapSessions={onSwapSessions} onUpdatePlan={onUpdatePlan} />;
            default: return <CoachActivityView intervalsData={historyData} dailyRecommendation={dailyRecommendation} activeMesocycleData={activeMesocycleData} weeklyPlan={weeklyPlan} onUpdatePlan={onUpdatePlan} onSwapSessions={onSwapSessions} onResetWeek={onResetWeek} allMesocycles={allMesocycles} />;
        }
    };

    const tabs = [
        { id: 'activity', label: 'Dashboard', icon: <Activity size={16} /> },
        { id: 'analysis', label: 'Análisis', icon: <Search size={16} /> },
        { id: 'correlations', label: 'Matriz', icon: <Microscope size={16} /> },
        { id: 'lab', label: 'Lab', icon: <Microscope size={16} /> },
        { id: 'plan', label: 'Mesociclos', icon: <Calendar size={16} /> },
    ];

    return (
        <div className="copilot-container stagger" style={{ paddingBottom: '5rem' }}>
            <div className="flex-col gap-lg">
                <nav className="card-glass hide-scrollbar" style={{
                    padding: '0.4rem',
                    borderRadius: '20px',
                    display: 'flex',
                    gap: '0.25rem',
                    overflowX: 'auto',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSubTab(tab.id)}
                            className="tap-active"
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                padding: '0.65rem 0.75rem',
                                borderRadius: '14px',
                                border: 'none',
                                background: subTab === tab.id ? 'var(--cyan)' : 'transparent',
                                color: subTab === tab.id ? '#000' : 'rgba(255,255,255,0.55)',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                whiteSpace: 'nowrap',
                                fontWeight: subTab === tab.id ? 900 : 700,
                                fontSize: '0.72rem',
                                minWidth: 0,
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="animate-fade-in">
                    {renderSubView()}
                </div>
            </div>
        </div>
    );
};

export default CoachHub;
