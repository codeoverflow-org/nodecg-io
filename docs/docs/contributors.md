<script type="text/javascript">
    fetch('https://api.github.com/repos/codeoverflow-org/nodecg-io/contributors').then(response => {
        response.json().then(data => {
            let idx = 1
            data.forEach(entry => {
                const div = document.createElement('div')
                div.style = `grid-column: 1; grid-row: ${idx}; display: inline-block `
                if ('avatar_url' in entry) {
                    div.innerHTML = `
                    <img src="${entry.avatar_url}" width="64" height="64" style="float: left; margin-top: 0">
                    <div style="float:left; margin-top: 0">
                    <span style="font-size: 16pt; font-weight: bold; margin-left: 1em;"><a href="${entry.html_url}" style="color: black;">${entry.login}</a></span><br>
                    <span style="font-size: 12pt; margin-left: 1em;"><a href="https://github.com/codeoverflow-org/nodecg-io/commits?author=${entry.login}" style="color: black;">${entry.contributions} contributions</a></p>
                    </div>
                    `
                } else {
                    div.innerHTML = `
                    <span style="font-size: 16pt; font-weight: bold; margin-left: 1em;">${entry.login}</span><br>
                    <span style="font-size: 12pt; margin-left: 1em;">${entry.contributions} contributions</p>
                    `
                }
                document.getElementById('contributorview').appendChild(div)
                idx += 1
            })
        })
    })
</script>

## Top 30 nodecg-io contributors

<div id="contributorview" style="display: grid">

</div>