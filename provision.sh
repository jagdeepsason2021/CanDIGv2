#!/usr/bin/env bash
# Optional args: CanDIGv2 repo path, CanDIGv2 repo branch
echo "started provision.sh" | tee -a ~/progress.txt
# sudo apt-get update
sudo apt-get upgrade -y
echo "  finished apt-get upgrade" | tee -a ~/progress.txt

# remove grub file and recreate, in case of version conflicts
sudo rm /boot/grub/menu.lst
sudo update-grub-legacy-ec2 -y
sudo apt-get dist-upgrade -y
sudo apt-get update
echo "  finished apt-get dist-upgrade" | tee -a ~/progress.txt

echo "  installing necessary packages" | tee -a ~/progress.txt
declare -a install_pkgs=("build-essential" "zlib1g-dev" "libncurses5-dev" "libgdbm-dev" "libnss3-dev" "libssl-dev" "libreadline-dev" "libffi-dev" "wget" "curl" "git" "make" "gcc" "libsqlite3-dev" "libbz2-dev" "liblzma-dev" "lzma" "sqlite3" "apt-transport-https" "ca-certificates" "gnupg2" "software-properties-common")

for pkg in ${install_pkgs[@]}; do
  sudo apt-get install -y $pkg
  if [ $? -ne 0 ]; then
    echo "ERROR! Failed to install $pkg" | tee -a ~/progress.txt
    exit 1
  fi
done

echo "  finished installs" | tee -a ~/progress.txt

if [ -n "$1" ]
then
    echo $1
    path=$1
else
    path=$PWD
fi

if [ -n "$2" ]
then
    branch="-b $2"
else
    branch=""
fi

cd $path
if grep -qs "CanDIGv2" .git/config; then
    echo "Specified path is a CanDIGv2 repo"
    git checkout $2
else
    echo "Cloning CanDIGv2..."
    git clone $branch https://github.com/CanDIG/CanDIGv2.git
    cd CanDIGv2/
fi

sudo chown -R $(whoami):$(whoami) $path
git submodule update --init --recursive
cp -i etc/env/example.env .env
echo "  finished setting up CanDIGv2 repo" | tee -a ~/progress.txt

dist=$(lsb_release -is)
codename=$(lsb_release -cs)

curl -fsSL https://download.docker.com/linux/${dist,,}/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/${dist,,} $(lsb_release -cs) stable"

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
echo "  finished installing docker components" | tee -a ~/progress.txt

sudo apt-get autoclean
sudo apt-get autoremove -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $(whoami)

make bin-all
if [ $? -ne 0 ]; then
  echo "ERROR! Failed make bin-all" | tee -a ~/progress.txt
  exit 1
fi

make init-conda
if [ $? -ne 0 ]; then
  echo "ERROR! Failed make init-conda" | tee -a ~/progress.txt
  exit 1
fi

echo "  starting candig pip install" | tee -a ~/progress.txt
source $PWD/bin/miniconda3/etc/profile.d/conda.sh
conda activate candig
pip install -U -r $PWD/etc/venv/requirements.txt
#pip install -U -r $PWD/etc/venv/requirements-dev.txt
echo "finished provision.sh" | tee -a ~/progress.txt