function startApp() {
    const KEY = 'kid_B1hdZCD4Q'
    const SECRET = '265d62c2343548c2a6343d386ccb53cc'
    const urlKinvey = 'https://baas.kinvey.com/'
    const HANDSHAKE = {'Authorization': 'Basic ' + btoa(`${KEY}:${SECRET}`)}
    let menuBoxes = $('#menu a')
    let bodyMainSections = $('body main section')
    let loadingBox = $('#loadingBox')
    let infoBox = $('#infoBox')
    let errorBox = $('#errorBox')

    showView('home')
    $('#linkRegister').on('click', register)
    $('#linkHome').on('click', () => showView('home'))
    $('#linkLogin').on('click',()=> login())
    $('#linkCreateAd').on('click', createAd)
    $('#linkListAds').on('click', listAds)
    $('#linkLogout').on('click', logout)
    $('#buttonRegisterUser').on('click', postUserReg)
    $('#buttonCreateAd').on('click', creatBtnAd)
    $('#buttonLoginUser').on('click', loginBtn)

    function sortingFilter() {
        $('#ads select').remove()
        let selectForm = $('<select>')
            .append($('<option>').text('Ordered by'))
            .append($('<option>').text('Title'))
            .append($('<option>').text('Publisher'))
            .append($('<option>').text('Price'))
            .append($('<option>').text('Date'))
            .change((ev) => {
                let option = $(ev.target).val()
                sort(option)

                function sort(option) {
                    switch (option) {
                        case 'Title':
                            window.keeping.sort((a, b) => {
                                return a.title.localeCompare(b.title)
                            })
                            tableCreate()
                            break
                        case 'Publisher':
                            window.keeping.sort((a, b) => {
                                return a.author.localeCompare(b.author)
                            })
                            tableCreate()
                            break
                        case 'Price':
                            window.keeping.sort((a, b) => {
                                return a.price - b.price
                            })
                            tableCreate()
                            break
                        case 'Date':
                            window.keeping.sort((a, b) => {
                                return new Date(a.date) - new Date(b.date)
                            })
                            tableCreate()
                            break
                    }
                }

            })


        $('#ads').prepend(selectForm)
    }

    function logout() {
        loadingBox.show()
        $.ajax({
            method: 'POST',
            url: `${urlKinvey}user/${KEY}/_logout`,
            headers: {Authorization: 'Kinvey ' + sessionStorage.getItem('authToken')}
        }).then(() => {
            loadingBox.hide()
            sessionStorage.clear()
            $('#linkHome').click()
        })
    }

    function listAds() {
        loadingBox.show()
        $.ajax({
            url: `${urlKinvey}appdata/${KEY}/Ads`,
            headers: {'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')}
        }).then((ads) => {
            window.keeping = ads
            loadingBox.hide()
            showView('listAds')
            tableCreate()
            sortingFilter()
        }).catch(() => errorBox.show())
    }

    function tableCreate() {
        let tbody = $('#ads tbody')
        tbody.empty().append($('<tr>')
            .append($('<th>').text('Title'))
            .append($('<th>').text('Publisher'))
            .append($('<th>').text('Description'))
            .append($('<th>').text('Price'))
            .append($('<th>').text('Date Published')))
        for (let ad of window.keeping) {
            let tr = $('<tr>')
                .append($('<td>').text(ad.title))
                .append($('<td>').text(ad.author))
                .append($('<td>').text(ad.description))
                .append($('<td>').text(ad.price))
                .append($('<td>').text(ad.date.split(' ').filter((e, i) => i < 4 && i > 0).join('-')))
            if (ad._acl.creator === sessionStorage.getItem('userID')) {
                tr.append($('<td>')
                    .append($('<a href="#">').text('[Delete]').on('click', (ev) => {
                        $.ajax({
                            method: 'DELETE',
                            url: `${urlKinvey}appdata/${KEY}/Ads/${ad._id}`,
                            headers: {Authorization: 'Kinvey ' + sessionStorage.getItem('authToken')}
                        }).catch(() => errorBox.show())
                        $(ev.target).parent().parent().remove()
                    }))
                    .append($('<a href="#">').text('[Edit]')).on('click', (ev) => {
                        showView('editAd')
                        let [curTit, curDesc, curDate, curPrice] = $(ev.target).parent().parent().find('td')
                        let [id, publisher, title, date, price] = $('#formEditAd input')
                        let textArea = $('#formEditAd textarea')[0]
                        $(title).val($(curTit).text())
                        $(price).val($(curPrice).text())
                        $(textArea).val($(curDesc).text())
                        $('#buttonEditAd').on('click', () => {
                            $.ajax({
                                method: 'PUT',
                                url: `${urlKinvey}appdata/${KEY}/Ads/${ad._id}`,
                                headers: {Authorization: 'Kinvey ' + sessionStorage.getItem('authToken')},
                                data: {
                                    title: $(title).val(),
                                    date: new Date($(date).val()),
                                    price: +$(price).val(),
                                    description: $(textArea).val(),
                                    author: sessionStorage.getItem('username')
                                }
                            }).then(() => {
                                $('#linkListAds').click()
                            })

                        })

                    }))
            }
            tbody.append(tr)

        }
    }

    function creatBtnAd() {
        let [title, date, price] = $('#formCreateAd input')
        let textArea = $('#formCreateAd textarea')[0]
        loadingBox.show()
        $.ajax({
            method: 'POST',
            url: `${urlKinvey}appdata/${KEY}/Ads`,
            headers: {'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')},
            data: {
                title: $(title).val(),
                date: new Date($(date).val()),
                price: +$(price).val(),
                description: $(textArea).val(),
                author: sessionStorage.getItem('username')
            }
        }).then((resp) => {
            loadingBox.hide()
            listAds()
            $(title).val('')
            $(date).val('')
            $(price).val('')
            $(textArea).val('')
        })
            .catch((err) => console.log(err.description))
    }

    function createAd() {
        showView('createAd')
    }

    function actualLogin(logResp) {
        sessionStorage.setItem('authToken', logResp._kmd.authtoken)
        sessionStorage.setItem('username', logResp.username)
        sessionStorage.setItem('userID', logResp._id)
        showView('loggedIn')
    }
    function loginBtn() {
        let [logUserInput, logPwdInput] = $('#viewLogin input')
        errorBox.hide()
        loadingBox.show()
        $.ajax({
            method: 'POST',
            url: `${urlKinvey}user/${KEY}/login`,
            headers: HANDSHAKE,
            data: {username: $(logUserInput).val(), password: $(logPwdInput).val()}
        }).then((resp) => {
            loadingBox.hide()
            actualLogin(resp)
            $(logUserInput).val('')
            $(logPwdInput).val('')
        })
            .catch((err) => {
                loadingBox.hide()
                errorBox.show()
            })
    }
    function login() {
        showView('login')
    }

    function postUserReg() {
        errorBox.hide()
        loadingBox.show()
        let [regUserInput, regPwdInput] = $('#viewRegister input')
        $.ajax({
            method: 'POST',
            url: `${urlKinvey}user/${KEY}`,
            headers: HANDSHAKE,
            data: {username: $(regUserInput).val(), password: $(regPwdInput).val()}
        }).then((suc) => {
            actualLogin(suc)
            loadingBox.hide()
            $(regUserInput).val('')
            $(regPwdInput).val('')
        })
            .catch((err) => {
                loadingBox.hide()
                errorBox.show()
            })
    }

    function register() {
        showView('register')
    }

    function showView(view) {
        switch (view) {
            case 'home':
                bodyMainSectionsFunc(3)
                if (sessionStorage.getItem('authToken') === null) {
                    bodyHeaderBoxes().defaultBoxes()
                } else {
                    bodyHeaderBoxes().loggedInBoxes()
                }
                break;
            case 'login':
                bodyMainSectionsFunc(4)
                bodyHeaderBoxes().defaultBoxes()
                break
            case 'register':
                bodyMainSectionsFunc(5)
                bodyHeaderBoxes().defaultBoxes()
                break
            case 'loggedIn':
                bodyMainSectionsFunc(3)
                bodyHeaderBoxes().loggedInBoxes()
                break
            case 'createAd':
                bodyMainSectionsFunc(7)
                break
            case 'listAds':
                bodyMainSectionsFunc(6)
                break
            case 'editAd':
                bodyMainSectionsFunc(8)
                break
        }
    }

    function bodyMainSectionsFunc(sectionIndex) {
        bodyMainSections.hide()
        $(bodyMainSections[sectionIndex]).show()
    }

    function bodyHeaderBoxes() {
        function loggedInBoxes() {
            menuBoxes.hide()
            menuBoxes.each((i, e) => {
                if (i === 0 || i > 2) $(e).show()
            })
        }

        function defaultBoxes() {
            menuBoxes.hide()
            menuBoxes.each((i, e) => {
                if (i < 3) $(e).show()
            })
        }

        return {defaultBoxes, loggedInBoxes}
    }
}