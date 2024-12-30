async function fetchLastCommit() {
    const response = await fetch('https://api.github.com/repos/keatonstacks/AVSupport/commits/main');
    const data = await response.json();
    const lastCommitDate = new Date(data.commit.committer.date);
    document.getElementById('lastUpdated').textContent = `Last Updated: ${lastCommitDate.toDateString()}`;
  }
  
  window.addEventListener('load', fetchLastCommit);