(function () {
    'use strict';

    const TOGGLE_KEY = 'p'; // Key to toggle the server selector menu

    const styles = {
        panel: {
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            width: '340px',
            background: 'linear-gradient(135deg, #0a0f29, #061424)',
            color: '#e0f7ff',
            padding: '20px',
            overflowY: 'auto',
            zIndex: '10000',
            maxHeight: '80%',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            display: 'none',
            fontFamily: "'Noto Sans JP', sans-serif",
        },
        button: {
            width: '100%',
            marginBottom: '14px',
            padding: '10px',
            backgroundColor: '#12284a',
            color: '#e0f7ff',
            border: '1px solid #1e355c',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
        },
        buttonHover: {
            backgroundColor: '#1e355c',
            color: '#a8efff',
        },
        selectedButton: {
            backgroundColor: '#a8efff',
            color: '#061424',
        },
    };

    const teamMap = {
        'Blue': '0x0',
        'Red': '0x1',
        'Purple': '0x2',
        'Green': '0x3',
    };

    function createElement(tag, attributes = {}, styles = {}, children = []) {
        const element = document.createElement(tag);
        Object.assign(element, attributes);
        Object.assign(element.style, styles);
        children.forEach(child => element.appendChild(child));
        return element;
    }

    function createButton(text, callback, extraStyles = {}) {
        const button = createElement('button', { textContent: text }, { ...styles.button, ...extraStyles });

        button.addEventListener('mouseenter', () => Object.assign(button.style, styles.buttonHover));
        button.addEventListener('mouseleave', () => Object.assign(button.style, { ...styles.button, ...extraStyles }));
        button.addEventListener('click', callback);
        button.tabIndex = 0;

        return button;
    }

    function togglePanel(panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    function setSelectedButtonStyle(button) {
        const buttons = button.parentElement.querySelectorAll('button');
        buttons.forEach(btn => Object.assign(btn.style, styles.button));
        Object.assign(button.style, styles.selectedButton);
    }

    function redirectToServer(server, gamemode, teamCode = '') {
        let url = `https://diep.io/?s=${server.ip}&g=${gamemode}`;
        if (teamCode) url += `&l=${teamCode}`;
        window.location.href = url;
    }

    function showOnly(panel, sectionId) {
        ['region-buttons', 'gamemode-buttons', 'server-buttons', 'team-buttons'].forEach(id => {
            const section = panel.querySelector(`#${id}`);
            section.style.display = id === sectionId ? 'block' : 'none';
        });
    }

    function populateButtons(panel, data) {
        const regionButtons = panel.querySelector('#region-buttons');
        const gamemodeButtons = panel.querySelector('#gamemode-buttons');
        const serverButtons = panel.querySelector('#server-buttons');
        const teamButtons = panel.querySelector('#team-buttons');

        const fragment = document.createDocumentFragment();
        data.regions.forEach(region => {
            const regionButton = createButton(`${region.regionName} (${region.numPlayers})`, () => {
                setSelectedButtonStyle(regionButton);
                showOnly(panel, 'gamemode-buttons');
                gamemodeButtons.innerHTML = '';

                const gamemodes = [...new Set(region.lobbies.map(lobby => lobby.gamemode))];
                gamemodes.forEach(gamemode => {
                    const gamemodeButton = createButton(gamemode, () => {
                        setSelectedButtonStyle(gamemodeButton);
                        showOnly(panel, 'server-buttons');
                        serverButtons.innerHTML = '';

                        const servers = region.lobbies.filter(lobby => lobby.gamemode === gamemode);
                        servers.forEach(server => {
                            const serverButton = createButton(`${server.ip} (${server.numPlayers})`, () => {
                                setSelectedButtonStyle(serverButton);
                                if (gamemode === 'ffa' || gamemode === 'maze') {
                                    redirectToServer(server, gamemode);
                                } else {
                                    showOnly(panel, 'team-buttons');
                                    teamButtons.innerHTML = '';
                                    const teams = gamemode === '2team' ? ['Blue', 'Red'] : Object.keys(teamMap);
                                    teams.forEach(team => {
                                        const teamButton = createButton(team, () => {
                                            setSelectedButtonStyle(teamButton);
                                            redirectToServer(server, gamemode, teamMap[team]);
                                        });
                                        teamButtons.appendChild(teamButton);
                                    });
                                }
                            });
                            serverButtons.appendChild(serverButton);
                        });
                    });
                    gamemodeButtons.appendChild(gamemodeButton);
                });
            });
            fragment.appendChild(regionButton);
        });

        regionButtons.appendChild(fragment);
    }

    function createSidePanel() {
        const panel = createElement('div', { id: 'server-selector' }, styles.panel, [
            createElement('h3', { textContent: 'Server Selector' }, { textAlign: 'center', color: '#a8efff', marginBottom: '20px' }),
            createElement('div', { id: 'region-buttons' }, {}, []),
            createElement('div', { id: 'gamemode-buttons', style: { display: 'none' } }, {}, []),
            createElement('div', { id: 'server-buttons', style: { display: 'none' } }, {}, []),
            createElement('div', { id: 'team-buttons', style: { display: 'none' } }, {}, []),
        ]);

        document.body.appendChild(panel);

        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === TOGGLE_KEY) {
                togglePanel(panel);
            }
        });

        return panel;
    }

    function fetchServers(panel) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://lb.diep.io/api/lb/pc',
            onload: function (response) {
                try {
                    const data = JSON.parse(response.responseText);
                    populateButtons(panel, data);
                } catch (error) {
                    console.error('Error parsing server data:', error);
                    alert('Failed to load servers. Please try again later.');
                }
            },
            onerror: function () {
                alert('Error fetching server data. Please try again later.');
            }
        });
    }

    const panel = createSidePanel();
    fetchServers(panel);
})();
