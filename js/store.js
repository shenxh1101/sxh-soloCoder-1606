const Store = (() => {
    const STORAGE_KEYS = {
        ORDERS: 'pet_shipping_orders',
        CAGES: 'pet_shipping_cages',
        STATUS_LOGS: 'pet_shipping_status_logs',
        HEALTH_LOGS: 'pet_shipping_health_logs',
        OPERATOR: 'pet_shipping_operator',
        ENV_LOGS: 'pet_shipping_env_logs',
        DISINFECT_LOGS: 'pet_shipping_disinfect_logs',
        TRANSPORT_NODES: 'pet_shipping_transport_nodes'
    };

    const TRANSPORT_NODE_TYPES = {
        pick_complete: { label: '取宠完成', icon: '✅', progress: 0.1, desc: '宠物已从发货人处安全接取' },
        mid_transit_1: { label: '途中中转·第1站', icon: '🔄', progress: 0.35, desc: '已通过第一中转站，检查正常' },
        mid_transit_2: { label: '途中中转·第2站', icon: '🔄', progress: 0.65, desc: '已通过第二中转站，宠物状态良好' },
        arrive_city: { label: '到达目的城市', icon: '🏙️', progress: 0.9, desc: '已到达目的地城市，等待派送' },
        delivering: { label: '派送中', icon: '🚚', progress: 0.97, desc: '派送员已出发，正在前往收货人地址' }
    };

    const DISINFECT_TYPES = {
        routine: '常规消毒',
        deep: '深度消毒',
        quick: '快速消毒',
        fumigation: '熏蒸消毒'
    };

    const OPERATOR_LIST = ['张管理员', '李值班员', '王调度', '赵护理员', '孙司机'];

    const STATUS_LABELS = {
        pending: '待接单',
        waiting_pickup: '待取宠',
        in_transit: '运输中',
        arrived: '到达目的地',
        delivered: '已签收'
    };

    const STATUS_DESCRIPTIONS = {
        pending: {
            title: '订单已创建，等待运营人员确认',
            etaText: '预计接单时间',
            etaHours: 1,
            icon: 'clipboard-list'
        },
        waiting_pickup: {
            title: '订单已确认，司机正在前往取宠',
            etaText: '预计取宠时间',
            etaHours: 3,
            icon: 'truck'
        },
        in_transit: {
            title: '宠物正在运输途中，全程监控中',
            etaText: '预计到达时间',
            etaHours: null,
            icon: 'plane'
        },
        arrived: {
            title: '宠物已到达目的地城市',
            etaText: '预计派送时间',
            etaHours: 2,
            icon: 'map-pin'
        },
        delivered: {
            title: '宠物已安全送达，感谢信任',
            etaText: '完成时间',
            etaHours: 0,
            icon: 'check-circle-2'
        }
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

    function hasAbnormalHealth(orderId) {
        const logs = getHealthLogsByOrder(orderId);
        return logs.some(log => log.is_abnormal);
    }

    function hasUnresolvedAbnormalHealth(orderId) {
        const logs = getHealthLogsByOrder(orderId);
        return logs.some(log => log.is_abnormal && !log.resolved);
    }

    function resolveHealthLog(logId, resolution, resolvedBy) {
        const logs = getHealthLogs();
        const idx = logs.findIndex(l => l.id === logId);
        if (idx === -1) return false;
        logs[idx].resolved = true;
        logs[idx].resolution = resolution || '';
        logs[idx].resolved_at = new Date().toISOString();
        logs[idx].resolved_by = resolvedBy || getOperator();
        saveHealthLogs(logs);
        return true;
    }

    function getAllUnresolvedAbnormalOrders() {
        const orders = getOrders();
        return orders.filter(o => hasUnresolvedAbnormalHealth(o.id));
    }

    function getEnvLogs() {
        return get(STORAGE_KEYS.ENV_LOGS, []);
    }

    function saveEnvLogs(logs) {
        return set(STORAGE_KEYS.ENV_LOGS, logs);
    }

    function addEnvLog(cageId, temperature, humidity) {
        const logs = getEnvLogs();
        logs.push({
            id: generateId('env'),
            cage_id: cageId,
            temperature,
            humidity,
            timestamp: new Date().toISOString()
        });
        const cageLogs = logs.filter(l => l.cage_id === cageId);
        if (cageLogs.length > 100) {
            const removeCount = cageLogs.length - 100;
            const sorted = cageLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            const toRemove = sorted.slice(0, removeCount).map(l => l.id);
            const filtered = logs.filter(l => !toRemove.includes(l.id));
            saveEnvLogs(filtered);
        } else {
            saveEnvLogs(logs);
        }
    }

    function getEnvLogsByCage(cageId) {
        return getEnvLogs().filter(l => l.cage_id === cageId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20);
    }

    function getDisinfectLogs() {
        return get(STORAGE_KEYS.DISINFECT_LOGS, []);
    }

    function saveDisinfectLogs(logs) {
        return set(STORAGE_KEYS.DISINFECT_LOGS, logs);
    }

    function addDisinfectLog(cageId, operator, type, notes, assignedTo) {
        const logs = getDisinfectLogs();
        logs.push({
            id: generateId('disinfect'),
            cage_id: cageId,
            operator: operator || getOperator(),
            type: type || 'routine',
            notes: notes || '',
            assigned_to: assignedTo || operator || getOperator(),
            timestamp: new Date().toISOString()
        });
        saveDisinfectLogs(logs);
    }

    function getDisinfectLogsByCage(cageId) {
        return getDisinfectLogs().filter(l => l.cage_id === cageId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }

    function getDisinfectLogsByOperator(operatorName, days) {
        const logs = getDisinfectLogs().filter(l => l.operator === operatorName);
        if (days && days > 0) {
            const cutoff = Date.now() - days * 86400000;
            return logs.filter(l => new Date(l.timestamp).getTime() >= cutoff)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function getDisinfectStatsByOperator(days) {
        const result = {};
        OPERATOR_LIST.forEach(op => result[op] = { count: 0, types: {} });
        const logs = days && days > 0
            ? getDisinfectLogs().filter(l => new Date(l.timestamp).getTime() >= Date.now() - days * 86400000)
            : getDisinfectLogs();
        logs.forEach(log => {
            const op = log.operator;
            if (!result[op]) result[op] = { count: 0, types: {} };
            result[op].count++;
            const t = DISINFECT_TYPES[log.type] || log.type;
            result[op].types[t] = (result[op].types[t] || 0) + 1;
        });
        return result;
    }

    function getTransportNodes() {
        return get(STORAGE_KEYS.TRANSPORT_NODES, []);
    }

    function saveTransportNodes(nodes) {
        return set(STORAGE_KEYS.TRANSPORT_NODES, nodes);
    }

    function getTransportNodesByOrder(orderId) {
        return getTransportNodes()
            .filter(n => n.order_id === orderId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    function addTransportNode(orderId, nodeType, operator, notes) {
        const typeConfig = TRANSPORT_NODE_TYPES[nodeType];
        if (!typeConfig) throw new Error('无效的运输节点类型');
        const nodes = getTransportNodes();
        const node = {
            id: generateId('tnode'),
            order_id: orderId,
            node_type: nodeType,
            label: typeConfig.label,
            icon: typeConfig.icon,
            progress: typeConfig.progress,
            description: typeConfig.desc,
            notes: notes || '',
            operator: operator || getOperator(),
            timestamp: new Date().toISOString()
        };
        nodes.push(node);
        saveTransportNodes(nodes);
        return node;
    }

    function removeTransportNode(nodeId) {
        const nodes = getTransportNodes().filter(n => n.id !== nodeId);
        saveTransportNodes(nodes);
    }

    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function getTransportETA(origin, dest, inTransitMs) {
        const originCoords = typeof origin === 'string' ? JSON.parse(origin) : origin;
        const destCoords = typeof dest === 'string' ? JSON.parse(dest) : dest;
        const distance = calculateDistance(
            originCoords.lat, originCoords.lng,
            destCoords.lat, destCoords.lng
        );
        const avgSpeed = 80;
        const totalHours = Math.max(3, distance / avgSpeed);
        const totalMs = totalHours * 3600 * 1000;
        const progress = inTransitMs ? Math.min(1, inTransitMs / totalMs) : 0;
        return {
            distance: Math.round(distance),
            totalHours: Math.round(totalHours * 10) / 10,
            totalMs,
            progress
        };
    }

    function initializeCages() {
        const existing = getCages();
        if (existing.length === 20) {
            let needUpgrade = false;
            existing.forEach(c => {
                if (!c.hasOwnProperty('assigned_to')) { c.assigned_to = ''; needUpgrade = true; }
                if (!c.hasOwnProperty('cleaning_notes')) { c.cleaning_notes = ''; needUpgrade = true; }
                if (!c.hasOwnProperty('cleaning_scheduled_at')) { c.cleaning_scheduled_at = null; needUpgrade = true; }
                if (!c.hasOwnProperty('cleaning_started_at')) { c.cleaning_started_at = null; needUpgrade = true; }
            });
            if (needUpgrade) saveCages(existing);
            return existing;
        }

        const cages = [];
        for (let i = 1; i <= 20; i++) {
            cages.push({
                id: `cage_${i}`,
                label: `笼位${String(i).padStart(2, '0')}`,
                status: 'available',
                temperature: 20 + Math.random() * 5,
                humidity: 45 + Math.random() * 20,
                last_disinfected: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
                disinfected_by: '系统初始化',
                assigned_to: '',
                cleaning_notes: '',
                cleaning_scheduled_at: null,
                cleaning_started_at: null
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
        STATUS_DESCRIPTIONS,
        STATUS_FLOW,
        CITIES,
        TRANSPORT_NODE_TYPES,
        DISINFECT_TYPES,
        OPERATOR_LIST,
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
        hasAbnormalHealth,
        hasUnresolvedAbnormalHealth,
        resolveHealthLog,
        getAllUnresolvedAbnormalOrders,
        getEnvLogs,
        saveEnvLogs,
        addEnvLog,
        getEnvLogsByCage,
        getDisinfectLogs,
        saveDisinfectLogs,
        addDisinfectLog,
        getDisinfectLogsByCage,
        getDisinfectLogsByOperator,
        getDisinfectStatsByOperator,
        getTransportNodes,
        saveTransportNodes,
        getTransportNodesByOrder,
        addTransportNode,
        removeTransportNode,
        getTransportETA,
        initializeCages,
        initializeMockData
    };
})();
