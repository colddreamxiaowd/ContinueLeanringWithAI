#include <cassert>
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <vector>

class CircularQueue {
  std::vector<int> data;
  std::size_t front = 0, rear = 0;
public:
  explicit CircularQueue(std::size_t n) : data(n) {
    if (n < 2) throw std::invalid_argument("n must be >= 2");
  }
  bool empty() const { return front == rear; }
  bool full() const { return (rear + 1) % data.size() == front; }
  bool push(int x) {
    if (full()) return false;
    data[rear] = x;
    rear = (rear + 1) % data.size();
    return true;
  }
  bool pop() {
    if (empty()) return false;
    front = (front + 1) % data.size();
    return true;
  }
};

int main() {
  CircularQueue q(5);
  assert(q.empty() && !q.full());
  assert(q.push(10) && q.push(20) && q.push(30) && q.push(40));
  assert(q.full() && !q.push(50));
  assert(q.pop() && q.pop());
  assert(!q.full());
  assert(q.push(50) && q.push(60)); // wraps around
  assert(q.full());
  for (int i=0;i<4;i++) assert(q.pop());
  assert(q.empty() && !q.pop());
  bool rejected = false;
  try { CircularQueue invalid(1); } catch (const std::invalid_argument&) { rejected = true; }
  assert(rejected);
  std::cout << "CircularQueue: all assertions passed\n";
}
