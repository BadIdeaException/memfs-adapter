# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.

Vagrant.configure("2") do |config|
  USERNAME="vagrant"

  config.vm.provider "docker" do |docker|
    # Create ssh keys unless they are already created
    %x(ssh-keygen -f #{USERNAME}.key -t ed25519 -N "") unless File.file?("#{USERNAME}.key")
        
    docker.build_dir = "."
    docker.build_args = [
      # Make default user inside the VM have the same UID and GID as the user running the vagrant command
      # This makes it a lot easier working with shared code locations, because the user will own the files
      "--build-arg", "USERNAME=#{USERNAME}",
      "--build-arg", "UID=#{Process.uid}",
      "--build-arg", "GID=#{Process.gid}",
      "--build-arg", "KEYFILE=#{USERNAME}.key.pub"      
    ]
    docker.has_ssh = true
    docker.remains_running = true
    # Use project's directory name as name for the container.
    # (Note that this will fail if such a container already exists.)
    docker.name = File.dirname(__FILE__).split("/").last
    # Use container name as hostname inside the container, as is the default behavior for other providers.
    docker.create_args = ["--hostname", docker.name]
  end

  config.ssh.username=USERNAME
  config.ssh.private_key_path="#{USERNAME}.key"

  # Expose port 9229 to allow debugging
  config.vm.network :forwarded_port, guest: 9229, host: 9229

  config.vm.provision "shell", name: "Install Node.JS", env: { "NODE_MAJOR" => "22" }, inline: <<-SHELL
    # Install necessary packages for downloading and verifying new repository information
    apt-get install -y ca-certificates curl gnupg
    # Create a directory for the new repository's keyring, if it doesn't exist
    mkdir -p /etc/apt/keyrings
    # Download the new repository's GPG key and save it in the keyring directory
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    # Add the new repository's source list with its GPG key for package verification
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
    # Update local package index to recognize the new repository
    sudo apt-get update
    # Install Node.js from the new repository
    sudo apt-get install -y nodejs
    sudo npm install typescript
  SHELL

  # Make aliases for some common npm run commands. "npm run debug-test" for example can then just be called by typing "debug-test"
  config.vm.provision "shell", name: "Install convenience commands", privileged: false, inline: <<-SHELL
    mkdir -p /home/vagrant/.local/bin
    echo 'pushd /vagrant; npm test -- $@; popd' > /home/vagrant/.local/bin/tests && chmod +x /home/vagrant/.local/bin/tests
    echo 'pushd /vagrant; npm run debug-test -- $@; popd' > /home/vagrant/.local/bin/debug-tests  && chmod +x /home/vagrant/.local/bin/debug-tests
    echo 'pushd /vagrant; npm run debug-local-test -- $@; popd' > /home/vagrant/.local/bin/debug-local-tests  && chmod +x /home/vagrant/.local/bin/debug-local-tests
  SHELL

  # Reflect host git user config in vm
  # This is necessary because otherwise using grunt to issue git commands will fail.
  userconfig = `git config -l | grep user`
  config.vm.provision "shell", name: "Configure git user on VM to be the same as on the host", privileged: false, inline: <<-SHELL
    # Read ruby userconfig variable line by line
    while read -r line; do      
      if [[ ! -z $line ]]; then # Skip empty line at EOF
        key=${line%=*} # key is $line, up to the =
        val=${line#*=} # val is $line, after the =
      
        echo "Running command: git config --global --add $key $val"
        git config --global --add "$key" "$val"
      fi
    done < <(echo "#{userconfig}")
  SHELL

  config.ssh.extra_args = ["-t", "cd /vagrant; bash --login"]
end
