/**
 * VIVO — Historical SST Data Capsule
 * Datos manuales de sesiones SST anteriores a la integración con Intervals.icu
 * Estos datos se inyectan en el buscador de Análisis cuando se busca "SST"
 */

export const HISTORICAL_SST = [
    {
        id: 'hist_2025-07-05',
        name: '18.6 Cartuja SST 3x10',
        start_date_local: '2025-07-05T09:00:00',
        description: 'SST 3x10m',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 600, average_watts: 178, average_heartrate: 137, efficiency: 1.30 },
            { serie: 2, moving_time: 600, average_watts: 182, average_heartrate: 134, efficiency: 1.36 },
            { serie: 3, moving_time: 600, average_watts: 188, average_heartrate: 136, efficiency: 1.38 },
        ]
    },
    {
        id: 'hist_2025-07-12',
        name: '19.6 Cartuja SST 3x12',
        start_date_local: '2025-07-12T09:00:00',
        description: 'SST 3x12m',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 720, average_watts: 194, average_heartrate: 139, efficiency: 1.40 },
            { serie: 2, moving_time: 720, average_watts: 197, average_heartrate: 141, efficiency: 1.40 },
            { serie: 3, moving_time: 720, average_watts: 196, average_heartrate: 141, efficiency: 1.39 },
        ]
    },
    {
        id: 'hist_2025-07-26',
        name: '10.6 A Casinos Z3 1x25m SST',
        start_date_local: '2025-07-26T09:00:00',
        description: 'SST 1x25m',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: 201,
        icu_intensity: null,
        average_heartrate: 144,
        intervals: [
            { serie: 1, moving_time: 1500, average_watts: 201, average_heartrate: 144, efficiency: 1.39 },
        ]
    },
    {
        id: 'hist_2025-08-03',
        name: 'Guadalest SST 3x12',
        start_date_local: '2025-08-03T09:00:00',
        description: 'SST 3x12m Guadalest',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 720, average_watts: 218, average_heartrate: 139, efficiency: 1.57 },
            { serie: 2, moving_time: 660, average_watts: 214, average_heartrate: 142, efficiency: 1.51 },
            { serie: 3, moving_time: 480, average_watts: 207, average_heartrate: 139, efficiency: 1.49 },
        ]
    },
    {
        id: 'hist_2025-08-09',
        name: "L'Alfàs del Pi Callosa SST 3x15",
        start_date_local: '2025-08-09T09:00:00',
        description: 'SST 3x15m Callosa',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 900, average_watts: 212, average_heartrate: 141, efficiency: 1.50 },
            { serie: 2, moving_time: 900, average_watts: 209, average_heartrate: 141, efficiency: 1.48 },
            { serie: 3, moving_time: 900, average_watts: 208, average_heartrate: 142, efficiency: 1.46 },
        ]
    },
    {
        id: 'hist_2025-08-30',
        name: 'SST 2x20 Cartuja',
        start_date_local: '2025-08-30T09:00:00',
        description: 'SST 2x20m Cartuja',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 1200, average_watts: 208, average_heartrate: 143, efficiency: 1.45 },
            { serie: 2, moving_time: 1200, average_watts: 206, average_heartrate: 142, efficiency: 1.45 },
        ]
    },
    {
        id: 'hist_2025-09-06',
        name: 'Cartuja SST 3x15',
        start_date_local: '2025-09-06T09:00:00',
        description: 'SST 3x15m Cartuja',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 900, average_watts: 213, average_heartrate: 143, efficiency: 1.49 },
            { serie: 2, moving_time: 900, average_watts: 213, average_heartrate: 142, efficiency: 1.50 },
            { serie: 3, moving_time: 900, average_watts: 214, average_heartrate: 141, efficiency: 1.52 },
        ]
    },
    {
        id: 'hist_2025-09-20',
        name: 'Cartuja SST 3x15',
        start_date_local: '2025-09-20T09:00:00',
        description: 'SST 3x15m Cartuja',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 900, average_watts: 209, average_heartrate: 144, efficiency: 1.45 },
            { serie: 2, moving_time: 900, average_watts: 210, average_heartrate: 145, efficiency: 1.45 },
            { serie: 3, moving_time: 900, average_watts: 209, average_heartrate: 145, efficiency: 1.44 },
        ]
    },
    {
        id: 'hist_2025-09-27',
        name: 'Cartuja SST 2x20 1x10',
        start_date_local: '2025-09-27T09:00:00',
        description: 'SST 2x20m 1x10m Cartuja',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 1200, average_watts: 206, average_heartrate: 145, efficiency: 1.42 },
            { serie: 2, moving_time: 1200, average_watts: 211, average_heartrate: 145, efficiency: 1.46 },
            { serie: 3, moving_time: 600, average_watts: 216, average_heartrate: 144, efficiency: 1.50 },
        ]
    },
    {
        id: 'hist_2025-10-04',
        name: 'Cartuja SST 1x18 1x15',
        start_date_local: '2025-10-04T09:00:00',
        description: 'SST 1x18m 1x15m Cartuja',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 1080, average_watts: 206, average_heartrate: 145, efficiency: 1.42 },
            { serie: 2, moving_time: 900, average_watts: 204, average_heartrate: 145, efficiency: 1.41 },
        ]
    },
    {
        id: 'hist_2025-11-02',
        name: 'Oronet x3 SST 3x12',
        start_date_local: '2025-11-02T09:00:00',
        description: 'SST 3x12m Oronet',
        _source: 'manual',
        _isHistorical: true,
        icu_training_load: null,
        icu_weighted_avg_watts: null,
        icu_intensity: null,
        average_heartrate: null,
        intervals: [
            { serie: 1, moving_time: 720, average_watts: 211, average_heartrate: null, efficiency: null }, // FC anómala (210*) — excluida
            { serie: 2, moving_time: 720, average_watts: 207, average_heartrate: 144, efficiency: 1.44 },
            { serie: 3, moving_time: 720, average_watts: 210, average_heartrate: 145, efficiency: 1.45 },
        ]
    },
];
