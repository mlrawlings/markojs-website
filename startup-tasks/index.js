const TaskList = require('task-list');
const path = require('path');
const serverTasks = require('./server-tasks');
const buildTasks = require('./build-tasks');

function loadTasks(tasks) {
    let loadedTasks = [];

    tasks.forEach((task) => {
        const filePath = path.resolve(__dirname, `./tasks/${task}.js`);
        loadedTasks.push(require(filePath));
    });

    return TaskList.create(loadedTasks);
}

exports.startServerTasks = () => {
   return loadTasks(serverTasks).startAll();
};

exports.startBuildTasks = () => {
    return loadTasks(buildTasks).startAll();
};
