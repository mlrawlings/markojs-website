let { register } = require('../../services/external-virtual-projects');

module.exports = {
    name: 'register-external-virtual-projects',
    start() {
        return register();
    }
};
