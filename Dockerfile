# This image is (indirectly) based on the official ubuntu:jammy image, but includes git, curl, wget and some other stuff out of the box.
FROM buildpack-deps:jammy

ARG USERNAME=vagrant
ARG UID=1000
ARG GID=1000
ARG KEYFILE=

# Set up default user
RUN groupadd -g $GID $USERNAME
RUN useradd -m -u $UID -g $GID -s /bin/bash $USERNAME

# This system has been minimized by removing packages and content that are required on a system that users do not log into.
# unminimize restores content and packages that are found on a default server system in order to make this system more suitable for interactive use.
RUN yes | unminimize 

# Install sudo (which for some bizarre reason is missing, and not restored by unminimize) and an SSH server.
RUN apt-get update && apt-get install -y sudo openssh-server
# Allow the default user passwordless sudo
RUN echo "$USERNAME      ALL = NOPASSWD: ALL" >> /etc/sudoers

# Configure SSH access with the passed public key (KEYFILE)
RUN mkdir /var/run/sshd
RUN mkdir -p "/home/$USERNAME/.ssh"
COPY $KEYFILE "/home/$USERNAME/.ssh/authorized_keys"
RUN chown -R "$USERNAME":"$USERNAME" "/home/$USERNAME/.ssh"
RUN echo "Host remotehost\n\tStrictHostKeyChecking no\n" >> "/home/$USERNAME/.ssh/config"

# Open port for SSH
EXPOSE 22

# Run SSH server (daemonized)
CMD ["/usr/sbin/sshd", "-D"]
