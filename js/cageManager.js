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
            Store.saveCages(cages);
            return true;
        }
        return false;
    }

    function setCleaning(cageId) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].status = 'cleaning';
            Store.saveCages(cages);
            return true;
        }
        return false;
    }

    function finishCleaning(cageId) {
        const cages = Store.getCages();
        const idx = cages.findIndex(c => c.id === cageId);
        if (idx !== -1) {
            cages[idx].status = 'available';
            Store.saveCages(cages);
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
            return true;
        }
        return false;
    }

    function simulateEnvironmentUpdate() {
        const cages = Store.getCages();
        cages.forEach(cage => {
            const tempChange = (Math.random() - 0.5) * 1.5;
            const humidityChange = (Math.random() - 0.5) * 5;
            let newTemp = cage.temperature + tempChange;
            let newHumidity = cage.humidity + humidityChange;
            newTemp = Math.max(15, Math.min(30, newTemp));
            newHumidity = Math.max(30, Math.min(80, newHumidity));
            cage.temperature = Math.round(newTemp * 10) / 10;
            cage.humidity = Math.round(newHumidity * 10) / 10;
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

    return {
        getAllCages,
        getCageById,
        getAvailableCages,
        getOccupiedCages,
        assignCage,
        releaseCage,
        setCleaning,
        finishCleaning,
        markDisinfected,
        updateEnvironment,
        simulateEnvironmentUpdate,
        getCageStats,
        getOrderByCage
    };
})();
