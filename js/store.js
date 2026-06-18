const Store = (() => {
    const STORAGE_KEYS = {
        ORDERS: 'pet_shipping_orders',
        CAGES: 'pet_shipping_cages',
        STATUS_LOGS: 'pet_shipping_status_logs',
        HEALTH_LOGS: 'pet_shipping_health_logs',
        OPERATOR: 'pet_shipping_operator'
    };

    const STATUS_LABELS = {
        pending: '待接单',
        waiting_pickup: '待取宠',
        in_transit: '运输中',
        arrived: '到达目的地',
        delivered: '已签收'
    };

    const STATUS_FLOW = ['pending', 'waiting_pickup', 'in_transit', 'arrived', 'delivered'];

    const CITIES = {
        '北京': { lat: 39.9042, lng: 116.4074 },
        '上海': { lat: 31.2304, lng: 121.4737 },
        '广州': { lat: 23.1291, lng: 113.2644 },
        '深圳': { lat: 22.5431, lng: 114.0579 },
        '成都': { lat: 30.5728, lng: 104.0668 },
        '杭州': { lat: 30.2741, lng: 120.1551 },
        '武汉': { lat: 30.5928, lng: 114.3055 },
        '西安': { lat: 34.3416, lng: 108.9398 }
    };

    function get(key, defaultValue) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('读取存储失败:', e);
            return defaultValue;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('写入存储失败:', e);
            return false;
        }
    }

    function generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    function generateOrderNo() {
        const date = new Date();
        const ymd = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') + 
                    date.getDate().toString().padStart(2, '0');
        const rand = Math.floor(Math.random() * 9000 + 1000);
        return `PT${ymd}${rand}`;
    }

    function formatDateTime(date) {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function formatDate(date) {
        if (!date) return '-';
        const d = typeof date === 'string' ? new Date(date) : date;
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function getToday() {
        return formatDate(new Date());
    }

    function getOrders() {
        return get(STORAGE_KEYS.ORDERS, []);
    }

    function saveOrders(orders) {
        return set(STORAGE_KEYS.ORDERS, orders);
    }

    function getCages() {
        return get(STORAGE_KEYS.CAGES, []);
    }

    function saveCages(cages) {
        return set(STORAGE_KEYS.CAGES, cages);
    }

    function getStatusLogs() {
        return get(STORAGE_KEYS.STATUS_LOGS, []);
    }

    function saveStatusLogs(logs) {
        return set(STORAGE_KEYS.STATUS_LOGS, logs);
    }

    function getHealthLogs() {
        return get(STORAGE_KEYS.HEALTH_LOGS, []);
    }

    function saveHealthLogs(logs) {
        return set(STORAGE_KEYS.HEALTH_LOGS, logs);
    }

    function getOperator() {
        return get(STORAGE_KEYS.OPERATOR, '管理员');
    }

    function setOperator(name) {
        return set(STORAGE_KEYS.OPERATOR, name);
    }

    function getStatusLogsByOrder(orderId) {
        return getStatusLogs().filter(log => log.order_id === orderId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    function getHealthLogsByOrder(orderId) {
        return getHealthLogs().filter(log => log.order_id === orderId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function initializeCages() {
        const existing = getCages();
        if (existing.length === 20) return existing;

        const cages = [];
        for (let i = 1; i <= 20; i++) {
            cages.push({
                id: `cage_${i}`,
                label: `笼位${String(i).padStart(2, '0')}`,
                status: 'available',
                temperature: 20 + Math.random() * 5,
                humidity: 45 + Math.random() * 20,
                last_disinfected: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
                disinfected_by: '系统初始化'
            });
        }
        saveCages(cages);
        return cages;
    }

    function initializeMockData() {
        const orders = getOrders();
        if (orders.length > 0) return;

        const cage1 = `cage_${Math.floor(Math.random() * 10) + 1}`;
        const cage2 = `cage_${Math.floor(Math.random() * 10) + 11}`;
        const cage3 = `cage_${Math.floor(Math.random() * 5) + 6}`;

        const mockOrders = [
            {
                id: generateId('order'),
                order_no: generateOrderNo(),
                pet_breed: '金毛犬',
                pet_weight: 28.5,
                vaccinated: true,
                origin: '北京',
                destination: '上海',
                origin_coords: JSON.stringify(CITIES['北京']),
                dest_coords: JSON.stringify(CITIES['上海']),
                ship_date: getToday(),
                cage_id: cage1,
                status: 'in_transit',
                created_at: new Date(Date.now() - 3600000 * 5).toISOString()
            },
            {
                id: generateId('order'),
                order_no: generateOrderNo(),
                pet_breed: '布偶猫',
                pet_weight: 4.2,
                vaccinated: true,
                origin: '上海',
                destination: '杭州',
                origin_coords: JSON.stringify(CITIES['上海']),
                dest_coords: JSON.stringify(CITIES['杭州']),
                ship_date: getToday(),
                cage_id: cage2,
                status: 'pending',
                created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
                id: generateId('order'),
                order_no: generateOrderNo(),
                pet_breed: '泰迪犬',
                pet_weight: 3.8,
                vaccinated: false,
                origin: '广州',
                destination: '深圳',
                origin_coords: JSON.stringify(CITIES['广州']),
                dest_coords: JSON.stringify(CITIES['深圳']),
                ship_date: getToday(),
                cage_id: cage3,
                status: 'waiting_pickup',
                created_at: new Date(Date.now() - 3600000 * 8).toISOString()
            }
        ];

        saveOrders(mockOrders);

        const cages = getCages();
        cages.forEach(c => {
            if (c.id === cage1 || c.id === cage2 || c.id === cage3) {
                c.status = 'occupied';
            }
        });
        saveCages(cages);

        const mockStatusLogs = [];
        mockOrders.forEach(order => {
            mockStatusLogs.push({
                id: generateId('log'),
                order_id: order.id,
                status: 'pending',
                timestamp: order.created_at,
                operator: '系统'
            });

            if (order.status !== 'pending') {
                const statuses = STATUS_FLOW.slice(1, STATUS_FLOW.indexOf(order.status) + 1);
                statuses.forEach((s, idx) => {
                    mockStatusLogs.push({
                        id: generateId('log'),
                        order_id: order.id,
                        status: s,
                        timestamp: new Date(new Date(order.created_at).getTime() + (idx + 1) * 3600000).toISOString(),
                        operator: '张管理员'
                    });
                });
            }
        });
        saveStatusLogs(mockStatusLogs);

        const mockHealthLogs = [
            {
                id: generateId('health'),
                order_id: mockOrders[0].id,
                diet_status: '饮食正常',
                mental_status: '精神状态良好',
                notes: '进食饮水正常，活动自如',
                timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
            },
            {
                id: generateId('health'),
                order_id: mockOrders[0].id,
                diet_status: '饮食正常',
                mental_status: '精神状态良好',
                notes: '',
                timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
            }
        ];
        saveHealthLogs(mockHealthLogs);
    }

    return {
        STORAGE_KEYS,
        STATUS_LABELS,
        STATUS_FLOW,
        CITIES,
        get,
        set,
        generateId,
        generateOrderNo,
        formatDateTime,
        formatDate,
        getToday,
        getOrders,
        saveOrders,
        getCages,
        saveCages,
        getStatusLogs,
        saveStatusLogs,
        getHealthLogs,
        saveHealthLogs,
        getOperator,
        setOperator,
        getStatusLogsByOrder,
        getHealthLogsByOrder,
        initializeCages,
        initializeMockData
    };
})();
