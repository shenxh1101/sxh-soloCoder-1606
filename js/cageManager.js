const CageManager = (() => {
    function getAllCages() {
        return Store.getCages();
    }

    function getCageById(id) {
        return Store.getCages().find(c => c.id === id);
    }

    function getAvailableCages() {
        return Store.getCages().filter(c => c.status === 'available');
    }

    function getOccupiedCages() {
        return Store.getCages().filter(c => c.status === 'occupied');
    }

    function assignCage() {
        const available = getAvailableCages();
        if (available.length === 0) {
            return null;
        }
        const cage = available[0];
        cage.status = 'occupied';
        cage.last_occupied_at = new Date().toISOString();
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cage.id);
        cages[idx] = cage;
        Store.saveCages(cages);
        return cage;
    }

    function releaseCage(cageId) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].status = 'available';
            cages[idx].last_released_at = new Date().toISOString();
            Store.saveCages(cages);
            return true;
        }
        return false;
    }

    function scheduleCleaning(cageId, operator) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].status = 'cleaning';
            cages[idx].cleaning_scheduled_at = new Date().toISOString();
            cages[idx].cleaning_scheduled_by = operator || Store.getOperator();
            Store.saveCages(cages);
            return true;
        }
        return false;
    }

    function setCleaning(cageId, operator) {
        return scheduleCleaning(cageId, operator);
    }

    function startCleaning(cageId, operator) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].cleaning_started_at = new Date().toISOString();
            cages[idx].cleaning_started_by = operator || Store.getOperator();
            Store.saveCages(cages);
            return true;
        }
        return false;
    }

    function finishCleaning(cageId, operator, disinfectType) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].status = 'available';
            cages[idx].cleaning_finished_at = new Date().toISOString();
            cages[idx].last_disinfected = new Date().toISOString();
            cages[idx].disinfected_by = operator || Store.getOperator();
            cages[idx].disinfect_type = disinfectType || 'standard';
            Store.saveCages(cages);
            Store.addDisinfectLog(cageId, operator, disinfectType || 'standard');
            return true;
        }
        return false;
    }

    function markDisinfected(cageId, operator) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].last_disinfected = new Date().toISOString();
            cages[idx].disinfected_by = operator || Store.getOperator();
            Store.saveCages(cages);
            Store.addDisinfectLog(cageId, operator, 'quick');
            return true;
        }
        return false;
    }

    function updateEnvironment(cageId, temperature, humidity) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            if (temperature !== undefined) cages[idx].temperature = temperature;
            if (humidity !== undefined) cages[idx].humidity = humidity;
            Store.saveCages(cages);
            Store.addEnvLog(cageId,
                temperature !== undefined ? temperature : cages[idx].temperature,
                humidity !== undefined ? humidity : cages[idx].humidity
            );
            return true;
        }
        return false;
    }

    function simulateEnvironmentUpdate() {
        const cages = Store.getCages();
        cages.forEach(cage => {
            const tempChange = (Math.random() - 0.5) * 1.2;
            const humidityChange = (Math.random() - 0.5) * 4;
            let newTemp = cage.temperature + tempChange;
            let newHumidity = cage.humidity + humidityChange;
            newTemp = Math.max(16, Math.min(28, newTemp));
            newHumidity = Math.max(35, Math.min(75, newHumidity));
            cage.temperature = Math.round(newTemp * 10) / 10;
            cage.humidity = Math.round(newHumidity * 10) / 10;
            Store.addEnvLog(cage.id, cage.temperature, cage.humidity);
        });
        Store.saveCages(cages);
    }

    function getCageStats() {
        const cages = Store.getCages();
        return {
            total: cages.length,
            available: cages.filter(c => c.status === 'available').length,
            occupied: cages.filter(c => c.status === 'occupied').length,
            cleaning: cages.filter(c => c.status === 'cleaning').length,
            occupancyRate: Math.round((cages.filter(c => c.status === 'occupied').length / cages.length) * 100)
        };
    }

    function getOrderByCage(cageId) {
        return Store.getOrders().find(o => o.cage_id === cageId && o.status !== 'delivered');
    }

    function getCageDetail(cageId) {
        const cage = getCageById(cageId);
        if (!cage) return null;
        return {
            cage,
            order: getOrderByCage(cageId),
            envLogs: Store.getEnvLogsByCage(cageId),
            disinfectLogs: Store.getDisinfectLogsByCage(cageId)
        };
    }

    return {
        getAllCages,
        getCageById,
        getAvailableCages,
        getOccupiedCages,
        assignCage,
        releaseCage,
        scheduleCleaning,
        setCleaning,
        startCleaning,
        finishCleaning,
        markDisinfected,
        updateEnvironment,
        simulateEnvironmentUpdate,
        getCageStats,
        getOrderByCage,
        getCageDetail
    };
})();
